/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2021  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or           *
 *    modify it under the terms of the GNU Lesser General Public License      *
 *    as published by the Free Software Foundation, either version 3 of       *
 *    the License, or (at your option) any later version.                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the            *
 *    GNU Lesser General Public License for more details.                     *
 *                                                                            *
 *    You should have received a copy of the GNU Lesser General               *
 *    Public License along with this program. If not, see                     *
 *    <http://www.gnu.org/licenses/>.                                         *
 *                                                                            *
 ******************************************************************************/


'use strict';


var bt = require('../basetypes');
var moveDescriptor = require('../movedescriptor');
var exception = require('../exception');
var i18n = require('../i18n');

var impl = require('./impl');
var fen = require('./fen');
var attacks = require('./attacks');
var legality = require('./legality');
var moveGeneration = require('./movegeneration');


/**
 * Convert the given move descriptor to standard algebraic notation.
 */
exports.getNotation = function(position, descriptor, pieceStyle) {
	var res = '';

	// Castling move
	if(descriptor.isCastling()) {
		res = descriptor._to % 16 === 6 ? 'O-O' : 'O-O-O';
	}

	// Pawn move
	else if(Math.floor(descriptor._movingPiece / 2) === bt.PAWN) {
		if(descriptor.isCapture()) {
			res += bt.fileToString(descriptor._from % 16) + 'x';
		}
		res += bt.squareToString(descriptor._to);
		if(descriptor.isPromotion()) {
			res += '=' + getPieceSymbol(descriptor._finalPiece, pieceStyle);
		}
	}

	// Non-pawn move
	else {
		res += getPieceSymbol(descriptor._movingPiece, pieceStyle);
		res += getDisambiguationSymbol(position, descriptor._from, descriptor._to);
		if(descriptor.isCapture()) {
			res += 'x';
		}
		res += bt.squareToString(descriptor._to);
	}

	// Check/checkmate detection and final result.
	res += getCheckCheckmateSymbol(position, descriptor);
	return res;
};


/**
 * Return a string representing the given chess piece according to the given style.
 */
function getPieceSymbol(coloredPiece, pieceStyle) {
	switch(pieceStyle) {
		case 'figurine':
			return bt.figurineToString(coloredPiece);
		case 'standard':
		default:
			return bt.pieceToString(Math.floor(coloredPiece / 2)).toUpperCase();
	}
}


/**
 * Return the check/checkmate symbol to use for a move.
 */
function getCheckCheckmateSymbol(position, descriptor) {
	var nextPosition = impl.makeCopy(position);
	moveGeneration.play(nextPosition, descriptor);
	return moveGeneration.isCheckmate(nextPosition) ? '#' : moveGeneration.isCheck(nextPosition) ? '+' : '';
}


/**
 * Return the disambiguation symbol to use for a move from `from` to `to`.
 */
function getDisambiguationSymbol(position, from, to) {
	var attackers = attacks.getAttacks(position, to, position.turn).filter(function(sq) { return position.board[sq]===position.board[from]; });

	// Disambiguation is not necessary if there less than 2 attackers.
	if(attackers.length < 2) {
		return '';
	}

	var foundNotPined = false;
	var foundOnSameRank = false;
	var foundOnSameFile = false;
	var rankFrom = Math.floor(from / 16);
	var fileFrom = from % 16;
	for(var i=0; i<attackers.length; ++i) {
		var sq = attackers[i];
		if(sq === from || isPinned(position, sq, to)) { continue; }

		foundNotPined = true;
		if(rankFrom === Math.floor(sq / 16)) { foundOnSameRank = true; }
		if(fileFrom === sq % 16) { foundOnSameFile = true; }
	}

	if(foundOnSameFile) {
		return foundOnSameRank ? bt.squareToString(from) : bt.rankToString(rankFrom);
	}
	else {
		return foundNotPined ? bt.fileToString(fileFrom) : '';
	}
}


/**
 * Whether the piece on the given square is pinned or not.
 */
function isPinned(position, sq, aimingAtSq) {
	var kingSquare = position.king[position.turn];
	if(kingSquare < 0) {
		return false;
	}

	var vector = Math.abs(kingSquare - sq);
	var aimingAtVector = Math.abs(aimingAtSq - sq);

	var pinnerQueen  = bt.QUEEN  * 2 + 1 - position.turn;
	var pinnerRook   = bt.ROOK   * 2 + 1 - position.turn;
	var pinnerBishop = bt.BISHOP * 2 + 1 - position.turn;

	// Potential pinning on file or rank.
	if(vector < 8) {
		return aimingAtVector >= 8 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 1 : -1, pinnerRook, pinnerQueen);
	}
	else if(vector % 16 === 0) {
		return aimingAtVector % 16 !==0 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 16 : -16, pinnerRook, pinnerQueen);
	}

	// Potential pinning on diagonal.
	else if(vector % 15 === 0) {
		return aimingAtVector % 15 !==0 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 15 : -15, pinnerBishop, pinnerQueen);
	}
	else if(vector % 17 === 0) {
		return aimingAtVector % 17 !==0 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 17 : -17, pinnerBishop, pinnerQueen);
	}

	// No pinning for sure.
	else {
		return false;
	}
}

function pinningLoockup(position, kingSquare, targetSquare, direction, pinnerColoredPiece1, pinnerColoredPiece2) {
	for(var sq = kingSquare + direction; sq !== targetSquare; sq += direction) {
		if(position.board[sq] !== bt.EMPTY) {
			return false;
		}
	}
	for(var sq = targetSquare + direction; (sq & 0x88) === 0; sq += direction) {
		if(position.board[sq] !== bt.EMPTY) {
			return position.board[sq] === pinnerColoredPiece1 || position.board[sq] === pinnerColoredPiece2;
		}
	}
	return false;
}


/**
 * Parse a move notation for the given position.
 *
 * @returns {MoveDescriptor}
 * @throws InvalidNotation
 */
exports.parseNotation = function(position, notation, strict, pieceStyle) {

	// General syntax
	var m = /^(?:(O-O-O|0-0-0)|(O-O|0-0)|([A-Z\u2654-\u265f])([a-h])?([1-8])?(x)?([a-h][1-8])|(?:([a-h])(x)?)?([a-h][1-8])(?:(=)?([A-Z\u2654-\u265f]))?)([+#])?$/.exec(notation);
	if(m === null) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_MOVE_NOTATION_SYNTAX);
	}

	// Ensure that the position is legal.
	if(!legality.isLegal(position)) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_POSITION);
	}

	// CASTLING
	// m[1] -> O-O-O
	// m[2] -> O-O

	// NON-PAWN MOVE
	// m[3] -> moving piece
	// m[4] -> file disambiguation
	// m[5] -> rank disambiguation
	// m[6] -> x (capture symbol)
	// m[7] -> to

	// PAWN MOVE
	// m[ 8] -> from column (only for captures)
	// m[ 9] -> x (capture symbol)
	// m[10] -> to
	// m[11] -> = (promotion symbol)
	// m[12] -> promoted piece

	// OTHER
	// m[13] -> +/# (check/checkmate symbol)

	var descriptor = null;

	// Parse castling moves
	if(m[1] || m[2]) {
		var from = position.king[position.turn];
		if(from < 0) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_NO_KING_CASTLING);
		}

		var toFile = getCastlingDestinationFile(position, m[2]);
		descriptor = toFile < 0 ? false : moveGeneration.isCastlingLegal(position, from, toFile + 112*position.turn);
		if(!descriptor) {
			var message = m[2] ? i18n.ILLEGAL_KING_SIDE_CASTLING : i18n.ILLEGAL_QUEEN_SIDE_CASTLING;
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, message);
		}
	}

	// Non-pawn move
	else if(m[3]) {
		var movingPiece = parsePieceSymbol(position, notation, m[3], strict, pieceStyle);
		var to = bt.squareFromString(m[7]);
		var toContent = position.board[to];

		// Cannot take your own pieces!
		if(toContent >= 0 && toContent % 2 === position.turn) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.TRYING_TO_CAPTURE_YOUR_OWN_PIECES);
		}

		// Capture may be mandatory in some variants.
		if(toContent < 0 && moveGeneration.isCaptureMandatory(position)) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.CAPTURE_IS_MANDATORY);
		}

		// Find the "from"-square candidates
		var attackers = attacks.getAttacks(position, to, position.turn).filter(function(sq) { return position.board[sq] === movingPiece*2 + position.turn; });

		// Apply disambiguation
		if(m[4]) {
			var fileFrom = bt.fileFromString(m[4]);
			attackers = attackers.filter(function(sq) { return sq%16 === fileFrom; });
		}
		if(m[5]) {
			var rankFrom = bt.rankFromString(m[5]);
			attackers = attackers.filter(function(sq) { return Math.floor(sq/16) === rankFrom; });
		}
		if(attackers.length===0) {
			var message = (m[4] || m[5]) ? i18n.NO_PIECE_CAN_MOVE_TO_DISAMBIGUATION : i18n.NO_PIECE_CAN_MOVE_TO;
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, message, m[3], m[7]);
		}

		// Compute the move descriptor for each remaining "from"-square candidate
		for(var i=0; i<attackers.length; ++i) {
			var currentDescriptor = moveGeneration.isKingSafeAfterMove(position, attackers[i], to, -1);
			if(currentDescriptor) {
				if(descriptor !== null) {
					throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.REQUIRE_DISAMBIGUATION, m[3], m[7]);
				}
				descriptor = currentDescriptor;
			}
		}
		if(descriptor === null) {
			var message = position.turn===bt.WHITE ? i18n.NOT_SAFE_FOR_WHITE_KING : i18n.NOT_SAFE_FOR_BLACK_KING;
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, message);
		}

		// STRICT-MODE -> check the disambiguation symbol.
		if(strict) {
			var expectedDS = getDisambiguationSymbol(position, descriptor._from, to);
			var observedDS = (m[4] ? m[4] : '') + (m[5] ? m[5] : '');
			if(expectedDS !== observedDS) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.WRONG_DISAMBIGUATION_SYMBOL, expectedDS, observedDS);
			}
		}
	}

	// Pawn move
	else if(m[10]) {
		var to = bt.squareFromString(m[10]);
		if(m[8]) {
			descriptor = getPawnCaptureDescriptor(position, notation, bt.fileFromString(m[8]), to);
		}
		else if(moveGeneration.isCaptureMandatory(position)) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.CAPTURE_IS_MANDATORY);
		}
		else {
			descriptor = getPawnAdvanceDescriptor(position, notation, to);
		}

		// Ensure that the pawn move do not let a king in check.
		if(!descriptor) {
			var message = position.turn===bt.WHITE ? i18n.NOT_SAFE_FOR_WHITE_KING : i18n.NOT_SAFE_FOR_BLACK_KING;
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, message);
		}

		// Detect promotions
		if(to<8 || to>=112) {
			if(!m[12]) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.MISSING_PROMOTION);
			}
			var promotion = parsePieceSymbol(position, notation, m[12], strict, pieceStyle);
			if(promotion === bt.PAWN || (promotion === bt.KING && position.variant !== bt.ANTICHESS)) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_PROMOTED_PIECE, m[12]);
			}
			descriptor = moveDescriptor.makePromotion(descriptor._from, descriptor._to, descriptor._movingPiece % 2, promotion, descriptor._optionalPiece);

			// STRICT MODE -> do not forget the `=` character!
			if(strict && !m[11]) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.MISSING_PROMOTION_SYMBOL);
			}
		}

		// Detect illegal promotion attempts!
		else if(m[12]) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_PROMOTION);
		}
	}

	// STRICT MODE
	if(strict) {
		if(descriptor.isCapture() !== (m[6] || m[9])) {
			var message = descriptor.isCapture() ? i18n.MISSING_CAPTURE_SYMBOL : i18n.INVALID_CAPTURE_SYMBOL;
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, message);
		}
		var expectedCCS = getCheckCheckmateSymbol(position, descriptor);
		var observedCCS = m[13] ? m[13] : '';
		if(expectedCCS !== observedCCS) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.WRONG_CHECK_CHECKMATE_SYMBOL, expectedCCS, observedCCS);
		}
	}

	// Final result
	return descriptor;
};


/**
 * Delegate function for piece symbol parsing.
 */
function parsePieceSymbol(position, notation, coloredPiece, strict, pieceStyle) {
	switch(pieceStyle) {

		case 'figurine':
			var coloredPiece = bt.figurineFromString(coloredPiece);
			if(piece < 0) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_PIECE_SYMBOL, coloredPiece);
			}
			if(strict && coloredPiece % 2 !== position.turn) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_PIECE_SYMBOL_COLOR, coloredPiece);
			}
			return Math.floor(coloredPiece / 2);

		case 'standard':
		default:
			var piece = bt.pieceFromString(coloredPiece.toLowerCase());
			if(piece < 0) {
				throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_PIECE_SYMBOL, coloredPiece);
			}
			return piece;
	}
}


/**
 * Delegate function that returns the file of a `to` square to take into account to check whether a castling move is legal or not.
 */
function getCastlingDestinationFile(position, isKingSideCastling) {
	if (position.variant === bt.CHESS960) {
		if (position.castling[position.turn] !== 0) {
			var castlingKing = bt.KING*2 + position.turn;
			for (var file = isKingSideCastling ? 7 : 0; position.board[file + 112*position.turn] !== castlingKing; file = file + (isKingSideCastling ? -1 : 1)) {
				if ((position.castling[position.turn] & (1 << file)) !== 0) {
					return file;
				}
			}
		}
		return -1;
	}
	else {
		return isKingSideCastling ? 6 : 2;
	}
}


/**
 * Delegate function for capture pawn move parsing.
 *
 * @returns {boolean|MoveDescriptor}
 */
function getPawnCaptureDescriptor(position, notation, columnFrom, to) {

	// Ensure that `to` is not on the 1st row.
	var from = to - 16 + position.turn*32;
	if((from & 0x88) !== 0) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
	}

	// Compute the "from"-square.
	var columnTo = to % 16;
	if(columnTo - columnFrom === 1) { from -= 1; }
	else if(columnTo - columnFrom === -1) { from += 1; }
	else {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "from"-square
	if(position.board[from] !== bt.PAWN*2+position.turn) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "to"-square
	var toContent = position.board[to];
	if(toContent < 0) {
		if(to === (5-position.turn*3)*16 + position.enPassant) { // detecting "en-passant" captures
			return moveGeneration.isKingSafeAfterMove(position, from, to, (4-position.turn)*16 + position.enPassant);
		}
	}
	else if(toContent % 2 !== position.turn) { // detecting regular captures
		return moveGeneration.isKingSafeAfterMove(position, from, to, -1);
	}

	throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
}


/**
 * Delegate function for non-capturing pawn move parsing.
 *
 * @returns {boolean|MoveDescriptor}
 */
function getPawnAdvanceDescriptor(position, notation, to) {

	// Ensure that `to` is not on the 1st row.
	var offset = 16 - position.turn*32;
	var from = to - offset;
	if((from & 0x88) !== 0) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "to"-square
	if(position.board[to] >= 0) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "from"-square
	var expectedFromContent = bt.PAWN*2+position.turn;
	if(position.board[from] === expectedFromContent) {
		return moveGeneration.isKingSafeAfterMove(position, from, to, -1);
	}

	// Look for two-square pawn moves
	else if(position.board[from] < 0) {
		from -= offset;
		var firstSquareOfArea = position.turn * 96; // a1 for white, a7 for black (2-square pawn move is allowed from 1st row at horde chess)
		if (from >= firstSquareOfArea && from < firstSquareOfArea + 24 && position.board[from] === expectedFromContent) {
			return moveGeneration.isKingSafeAfterMove(position, from, to, -1);
		}
	}

	throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
}
