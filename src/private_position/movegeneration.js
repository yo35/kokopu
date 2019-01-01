/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2019  Yoann Le Montagner <yo35 -at- melix.net>       *
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
var attacks = require('./attacks');
var legality = require('./legality');


/* eslint-disable no-mixed-spaces-and-tabs, indent */

// Displacement lookup per square index difference.
var /* const */ DISPLACEMENT_LOOKUP = [
 204,    0,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,    0,  204,    0,
	 0,  204,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,  204,    0,    0,
	 0,    0,  204,    0,    0,    0,    0,   60,    0,    0,    0,    0,  204,    0,    0,    0,
	 0,    0,    0,  204,    0,    0,    0,   60,    0,    0,    0,  204,    0,    0,    0,    0,
	 0,    0,    0,    0,  204,    0,    0,   60,    0,    0,  204,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  204,  768,   60,  768,  204,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  768, 2255, 2111, 2255,  768,    0,    0,    0,    0,    0,    0,
	60,   60,   60,   60,   60,   60,   63,    0,   63,   60,   60,   60,   60,   60,   60,    0,
	 0,    0,    0,    0,    0,  768, 1231, 1087, 1231,  768,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  204,  768,   60,  768,  204,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,  204,    0,    0,   60,    0,    0,  204,    0,    0,    0,    0,    0,
	 0,    0,    0,  204,    0,    0,    0,   60,    0,    0,    0,  204,    0,    0,    0,    0,
	 0,    0,  204,    0,    0,    0,    0,   60,    0,    0,    0,    0,  204,    0,    0,    0,
	 0,  204,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,  204,    0,    0,
 204,    0,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,    0,  204,    0
];

// Sliding direction
var /* const */ SLIDING_DIRECTION = [
	-17,   0,   0,   0,   0,   0,   0, -16,   0,   0,   0,   0,   0,   0, -15,   0,
		0, -17,   0,   0,   0,   0,   0, -16,   0,   0,   0,   0,   0, -15,   0,   0,
		0,   0, -17,   0,   0,   0,   0, -16,   0,   0,   0,   0, -15,   0,   0,   0,
		0,   0,   0, -17,   0,   0,   0, -16,   0,   0,   0, -15,   0,   0,   0,   0,
		0,   0,   0,   0, -17,   0,   0, -16,   0,   0, -15,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0, -17,   0, -16,   0, -15,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0,   0, -17, -16, -15,   0,   0,   0,   0,   0,   0,   0,
	 -1,  -1,  -1,  -1,  -1,  -1,  -1,   0,   1,   1,   1,   1,   1,   1,   1,   0,
		0,   0,   0,   0,   0,   0,  15,  16,  17,   0,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0,  15,   0,  16,   0,  17,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,  15,   0,   0,  16,   0,   0,  17,   0,   0,   0,   0,   0,
		0,   0,   0,  15,   0,   0,   0,  16,   0,   0,   0,  17,   0,   0,   0,   0,
		0,   0,  15,   0,   0,   0,   0,  16,   0,   0,   0,   0,  17,   0,   0,   0,
		0,  15,   0,   0,   0,   0,   0,  16,   0,   0,   0,   0,   0,  17,   0,   0,
	 15,   0,   0,   0,   0,   0,   0,  16,   0,   0,   0,   0,   0,   0,  17,   0
];

/* eslint-enable no-mixed-spaces-and-tabs, indent */


exports.isCheck = function(position) {
	return legality.isLegal(position) && attacks.isAttacked(position, position.king[position.turn], 1-position.turn);
};


exports.isCheckmate = function(position) {
	return legality.isLegal(position) && !hasMove(position) && attacks.isAttacked(position, position.king[position.turn], 1-position.turn);
};


exports.isStalemate = function(position) {
	return legality.isLegal(position) && !hasMove(position) && !attacks.isAttacked(position, position.king[position.turn], 1-position.turn);
};


var hasMove = exports.hasMove = function(position) {
	function MoveFound() {}
	try {
		generateMoves(position, function(descriptor) {
			if(descriptor) { throw new MoveFound(); }
		});
		return false;
	}
	catch(err) {
		if(err instanceof MoveFound) { return true; }
		else { throw err; }
	}
};


exports.moves = function(position) {
	var res = [];
	generateMoves(position, function(descriptor, generatePromotions) {
		if(descriptor) {
			if(generatePromotions) {
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position.turn, bt.QUEEN , descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position.turn, bt.ROOK  , descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position.turn, bt.BISHOP, descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position.turn, bt.KNIGHT, descriptor._optionalPiece));
			}
			else {
				res.push(descriptor);
			}
		}
	});
	return res;
};


/**
 * Generate all the legal moves of the given position.
 */
function generateMoves(position, fun) {

	// Ensure that the position is legal.
	if(!legality.isLegal(position)) { return; }

	// For all potential 'from' square...
	for(var from=0; from<120; from += (from & 0x7)===7 ? 9 : 1) {

		// Nothing to do if the current square does not contain a piece of the right color.
		var fromContent = position.board[from];
		var movingPiece = Math.floor(fromContent / 2);
		if(fromContent < 0 || fromContent%2 !== position.turn) {
			continue;
		}

		// Generate moves for pawns
		if(movingPiece === bt.PAWN) {

			// Capturing moves
			var attackDirections = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<attackDirections.length; ++i) {
				var to = from + attackDirections[i];
				if((to & 0x88) === 0) {
					var toContent = position.board[to];
					if(toContent >= 0 && toContent%2 !== position.turn) { // regular capturing move
						fun(isKingSafeAfterMove(position, from, to, -1), to<8 || to>=112);
					}
					else if(toContent < 0 && to === (5-position.turn*3)*16 + position.enPassant) { // en-passant move
						fun(isKingSafeAfterMove(position, from, to, (4-position.turn)*16 + position.enPassant), false);
					}
				}
			}

			// Non-capturing moves
			var moveDirection = 16 - position.turn*32;
			var to = from + moveDirection;
			if(position.board[to] < 0) {
				fun(isKingSafeAfterMove(position, from, to, -1), to<8 || to>=112);

				// 2-square pawn move
				var firstSquareOfRow = (1 + position.turn*5) * 16;
				if(from>=firstSquareOfRow && from<firstSquareOfRow+8) {
					to += moveDirection;
					if(position.board[to] < 0) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
				}
			}
		}

		// Generate moves for non-sliding non-pawn pieces
		else if(movingPiece===bt.KNIGHT || movingPiece===bt.KING) {
			var directions = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				var to = from + directions[i];
				if((to & 0x88) === 0) {
					var toContent = position.board[to];
					if(toContent < 0 || toContent%2 !== position.turn) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
				}
			}
		}

		// Generate moves for sliding pieces
		else {
			var directions = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				for(var to = from + directions[i]; (to & 0x88) === 0; to += directions[i]) {
					var toContent = position.board[to];
					if(toContent < 0 || toContent%2 !== position.turn) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
					if(toContent >= 0) { break; }
				}
			}
		}

		// Generate castling moves
		if(movingPiece === bt.KING && position.castling[position.turn] !== 0) {
			fun(isCastlingLegal(position, from, 2 + 112*position.turn), false);
			fun(isCastlingLegal(position, from, 6 + 112*position.turn), false);
		}
	}
}


/**
 * Check whether the current player king is in check after moving from `from` to `to`.
 *
 * This function implements the verification steps (7) to (9) as defined in {@link #isMoveLegal}
 *
 * @param {number} enPassantSquare Index of the square where the "en-passant" taken pawn lies if any, `-1` otherwise.
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
var isKingSafeAfterMove = exports.isKingSafeAfterMove = function(position, from, to, enPassantSquare) {
	var fromContent = position.board[from];
	var toContent   = position.board[to  ];
	var movingPiece = Math.floor(fromContent / 2);

	// Step (7) -> Execute the displacement (castling moves are processed separately).
	position.board[to  ] = fromContent;
	position.board[from] = bt.EMPTY;
	if(enPassantSquare >= 0) {
		position.board[enPassantSquare] = bt.EMPTY;
	}

	// Step (8) -> Is the king safe after the displacement?
	var kingSquare    = movingPiece===bt.KING ? to : position.king[position.turn];
	var kingIsInCheck = attacks.isAttacked(position, kingSquare, 1-position.turn);

	// Step (9) -> Reverse the displacement.
	position.board[from] = fromContent;
	position.board[to  ] = toContent;
	if(enPassantSquare >= 0) {
		position.board[enPassantSquare] = bt.PAWN*2 + 1-position.turn;
	}

	// Final result
	if(kingIsInCheck) {
		return false;
	}
	else {
		if(enPassantSquare >= 0) {
			return moveDescriptor.makeEnPassant(from, to, enPassantSquare, position.turn);
		}
		else {
			return moveDescriptor.make(from, to, position.turn, movingPiece, toContent);
		}
	}
};


/**
 * Delegated method for checking whether a castling move is legal or not.
 */
var isCastlingLegal = exports.isCastlingLegal = function(position, from, to) {

	// Origin and destination squares of the rook involved in the move.
	var castleFile = -1;
	var rookTo = -1;
	if(to === 2 + position.turn*112) {
		castleFile = position.variant === bt.CHESS_960 ? findCastleFile(position.castling[position.turn], from % 16, -1) : 0;
		rookTo = 3 + 112*position.turn;
	}
	else if(to === 6 + position.turn*112) {
		castleFile = position.variant === bt.CHESS_960 ? findCastleFile(position.castling[position.turn], from % 16, 1) : 7;
		rookTo = 5 + 112*position.turn;
	}
	else {
		return false;
	}

	// Ensure that the given underlying castling is allowed.
	if(position.variant === bt.CHESS_960) {
		if(castleFile === -1) { return false; }
	}
	else {
		if((position.castling[position.turn] & 1<<castleFile) === 0) { return false; }
	}

	var rookFrom = castleFile + position.turn*112;

	// Ensure that each square on the trajectory is empty.
	for(var sq = Math.min(from, to, rookFrom, rookTo); sq <= Math.max(from, to, rookFrom, rookTo); ++sq) {
		if(sq !== from && sq !== rookFrom && position.board[sq] !== bt.EMPTY) { return false; }
	}

	// The origin and destination squares of the king, and the square between them must not be attacked.
	var byWho = 1 - position.turn;
	for(var sq = Math.min(from, to); sq <= Math.max(from, to); ++sq) {
		if(attacks.isAttacked(position, sq, byWho)) { return false; }
	}

	// The move is legal -> generate the move descriptor.
	return moveDescriptor.makeCastling(from, to, rookFrom, rookTo, position.turn);
};


function findCastleFile(castlingFlag, kingFile, offset) {
	for(var file = kingFile + offset; file >= 0 && file < 8; file += offset) {
		if((castlingFlag & 1 << file) !== 0) { return file; }
	}
	return -1;
}


/**
 * Core algorithm to determine whether a move is legal or not. The verification flow is the following:
 *
 *  1. Ensure that the position itself is legal.
 *  2. Ensure that the origin square contains a piece (denoted as the moving-piece)
 *     whose color is the same than the color of the player about to play.
 *  4. Ensure that the displacement is geometrically correct, with respect to the moving piece.
 *  5. Check the content of the destination square.
 *  6. For the sliding pieces (and in case of a 2-square pawn move), ensure that there is no piece
 *     on the trajectory.
 *
 * The move is almost ensured to be legal at this point. The last condition to check
 * is whether the king of the current player will be in check after the move or not.
 *
 *  7. Execute the displacement from the origin to the destination square, in such a way that
 *     it can be reversed. Only the state of the board is updated at this point.
 *  8. Look for king attacks.
 *  9. Reverse the displacement.
 *
 * Castling moves fail at step (4). They are taken out of this flow and processed
 * by the dedicated method `isLegalCastling()`.
 */
exports.isMoveLegal = function(position, from, to) {

	// Step (1)
	if(!legality.isLegal(position)) { return false; }

	// Step (2)
	var fromContent = position.board[from];
	var toContent   = position.board[to  ];
	var movingPiece = Math.floor(fromContent / 2);
	if(fromContent < 0 || fromContent%2 !== position.turn) { return false; }

	// Miscellaneous variables
	var displacement = to - from + 119;
	var enPassantSquare = -1; // square where a pawn is taken if the move is "en-passant"
	var isTwoSquarePawnMove = false;
	var isPromotion = movingPiece===bt.PAWN && (to<8 || to>=112);

	// Compute the move descriptor corresponding to castling, if applicable.
	var castlingDescriptor = false;
	if(movingPiece === bt.KING && position.castling[position.turn] !== 0) {
		castlingDescriptor = isCastlingLegal(position, from, to);
	}

	// Step (4)
	if((DISPLACEMENT_LOOKUP[displacement] & 1 << fromContent) === 0) {
		if(movingPiece === bt.PAWN && displacement === 151-position.turn*64) {
			var firstSquareOfRow = (1 + position.turn*5) * 16;
			if(from < firstSquareOfRow || from >= firstSquareOfRow+8) { return false; }
			isTwoSquarePawnMove = true;
		}
		else {
			return castlingDescriptor;
		}
	}

	// Step (5) -> check the content of the destination square
	if(movingPiece === bt.PAWN) {
		if(displacement === 135-position.turn*32 || isTwoSquarePawnMove) { // non-capturing pawn move
			if(toContent !== bt.EMPTY) { return false; }
		}
		else if(toContent === bt.EMPTY) { // en-passant pawn move
			if(position.enPassant < 0 || to !== (5-position.turn*3)*16 + position.enPassant) { return false; }
			enPassantSquare = (4-position.turn)*16 + position.enPassant;
		}
		else { // regular capturing pawn move
			if(toContent%2 === position.turn) { return false; }
		}
	}
	else { // piece move
		if(toContent >= 0 && toContent%2 === position.turn) { return castlingDescriptor; }
	}

	// Step (6) -> For sliding pieces, ensure that there is nothing between the origin and the destination squares.
	if(movingPiece === bt.BISHOP || movingPiece === bt.ROOK || movingPiece === bt.QUEEN) {
		var direction = SLIDING_DIRECTION[displacement];
		for(var sq=from + direction; sq !== to; sq += direction) {
			if(position.board[sq] !== bt.EMPTY) { return false; }
		}
	}
	else if(isTwoSquarePawnMove) { // two-square pawn moves also require this test.
		if(position.board[(from + to) / 2] !== bt.EMPTY) { return false; }
	}

	// Steps (7) to (9) are delegated to `isKingSafeAfterMove`.
	var descriptor = isKingSafeAfterMove(position, from, to, enPassantSquare);
	if(descriptor && isPromotion) {
		return {
			type: 'promotion',
			build: function(promotion) {
				return promotion !== bt.PAWN && promotion !== bt.KING ?
					moveDescriptor.makePromotion(descriptor._from, descriptor._to, descriptor._movingPiece % 2, promotion, descriptor._optionalPiece) :
					false;
			}
		};
	}
	else if(descriptor && castlingDescriptor) {
		return {
			type: 'castle960',
			build: function(type) {
				return type ? castlingDescriptor : descriptor;
			}
		};
	}
	else if(descriptor) {
		return descriptor;
	}
	else if(castlingDescriptor) {
		return castlingDescriptor;
	}
	else {
		return false;
	}
};


/**
 * Play the move corresponding to the given descriptor.
 */
exports.play = function(position, descriptor) {

	// Update the board.
	position.board[descriptor._from] = bt.EMPTY; // WARNING: update `from` before `to` in case both squares are actually the same!
	if(descriptor.isEnPassant()) {
		position.board[descriptor._optionalSquare1] = bt.EMPTY;
	}
	else if(descriptor.isCastling()) {
		position.board[descriptor._optionalSquare1] = bt.EMPTY;
		position.board[descriptor._optionalSquare2] = descriptor._optionalPiece;
	}
	position.board[descriptor._to] = descriptor._finalPiece;

	var movingPiece = Math.floor(descriptor._movingPiece / 2);

	// Update the castling flags.
	if(movingPiece === bt.KING) {
		position.castling[position.turn] = 0;
	}
	if(descriptor._from <    8) { position.castling[bt.WHITE] &= ~(1 <<  descriptor._from    ); }
	if(descriptor._to   <    8) { position.castling[bt.WHITE] &= ~(1 <<  descriptor._to      ); }
	if(descriptor._from >= 112) { position.castling[bt.BLACK] &= ~(1 << (descriptor._from%16)); }
	if(descriptor._to   >= 112) { position.castling[bt.BLACK] &= ~(1 << (descriptor._to  %16)); }

	// Update the en-passant flag.
	position.enPassant = -1;
	if(movingPiece === bt.PAWN && Math.abs(descriptor._from - descriptor._to)===32) {
		var otherPawn = descriptor._movingPiece ^ 0x01;
		var squareBefore = descriptor._to - 1;
		var squareAfter = descriptor._to + 1;
		if(((squareBefore & 0x88) === 0 && position.board[squareBefore] === otherPawn) ||
			((squareAfter & 0x88) === 0 && position.board[squareAfter]===otherPawn)) {
			position.enPassant = descriptor._to % 16;
		}
	}

	// Update the computed flags.
	if(movingPiece === bt.KING) {
		position.king[position.turn] = descriptor._to;
	}

	// Toggle the turn flag.
	position.turn = 1 - position.turn;
};


/**
 * Determine if a null-move (i.e. switching the player about to play) can be play in the current position.
 * A null-move is possible if the position is legal and if the current player about to play is not in check.
 */
var isNullMoveLegal = exports.isNullMoveLegal = function(position) {
	return legality.isLegal(position) && !attacks.isAttacked(position, position.king[position.turn], 1-position.turn);
};


/**
 * Play a null-move on the current position if it is legal.
 */
exports.playNullMove = function(position) {
	if(isNullMoveLegal(position)) {
		position.turn = 1 - position.turn;
		position.enPassant = -1;
		return true;
	}
	else {
		return false;
	}
};
