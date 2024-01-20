/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2024  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    Kokopu is free software: you can redistribute it and/or                 *
 *    modify it under the terms of the GNU Lesser General Public License      *
 *    as published by the Free Software Foundation, either version 3 of       *
 *    the License, or (at your option) any later version.                     *
 *                                                                            *
 *    Kokopu is distributed in the hope that it will be useful,               *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the            *
 *    GNU Lesser General Public License for more details.                     *
 *                                                                            *
 *    You should have received a copy of the GNU Lesser General               *
 *    Public License along with this program. If not, see                     *
 *    <http://www.gnu.org/licenses/>.                                         *
 *                                                                            *
 * -------------------------------------------------------------------------- */


import { getAttacks } from './attacks';
import { ColorImpl, PieceImpl, SpI, GameVariantImpl, figurineFromString, figurineToString, fileFromString, fileToString, rankFromString, rankToString,
	pieceFromString, pieceToString, squareFromString, squareToString } from './base_types_impl';
import { getFEN } from './fen';
import { PositionImpl, makeCopy } from './impl';
import { isLegal, isKingSafeAfterMove, refreshEffectiveEnPassant, refreshEffectiveCastling } from './legality';
import { MoveDescriptorImpl } from './move_descriptor_impl';
import { isCheckmate, isCheck, isCaptureMandatory, isCastlingMoveLegal, play } from './move_generation';

import { InvalidNotation } from '../exception';
import { i18n } from '../i18n';


/**
 * Convert the given move descriptor to standard algebraic notation.
 */
export function getNotation(position: PositionImpl, descriptor: MoveDescriptorImpl, pieceStyle: 'standard' | 'figurine') {
	let result = '';

	// Castling move
	if (descriptor.isCastling()) {
		result = descriptor._to % 16 === 6 ? 'O-O' : 'O-O-O';
	}

	// Pawn move
	else if (Math.trunc(descriptor._movingColoredPiece / 2) === PieceImpl.PAWN) {
		if (descriptor.isCapture()) {
			result += fileToString(descriptor._from % 16) + 'x';
		}
		result += squareToString(descriptor._to);
		if (descriptor.isPromotion()) {
			result += '=' + getPieceSymbol(descriptor._finalColoredPiece, pieceStyle);
		}
	}

	// Non-pawn move
	else {
		result += getPieceSymbol(descriptor._movingColoredPiece, pieceStyle);
		result += getDisambiguationSymbol(position, descriptor._from, descriptor._to);
		if (descriptor.isCapture()) {
			result += 'x';
		}
		result += squareToString(descriptor._to);
	}

	// Check/checkmate detection and final result.
	result += getCheckCheckmateSymbol(position, descriptor);
	return result;
}


/**
 * Return a string representing the given chess piece according to the given style.
 */
function getPieceSymbol(coloredPiece: number, pieceStyle: 'standard' | 'figurine') {
	switch (pieceStyle) {
		case 'figurine':
			return figurineToString(coloredPiece);
		case 'standard':
			return pieceToString(Math.trunc(coloredPiece / 2)).toUpperCase();
	}
}


/**
 * Return the check/checkmate symbol to use for a move.
 */
function getCheckCheckmateSymbol(position: PositionImpl, descriptor: MoveDescriptorImpl) {
	const nextPosition = makeCopy(position);
	play(nextPosition, descriptor);
	return isCheckmate(nextPosition) ? '#' : isCheck(nextPosition) ? '+' : '';
}


/**
 * Return the disambiguation symbol to use for a move from `from` to `to`.
 */
function getDisambiguationSymbol(position: PositionImpl, from: number, to: number) {
	const attackers = getAttacks(position, to, position.turn).filter(sq => position.board[sq] === position.board[from]);

	// Disambiguation is not necessary if there less than 2 attackers.
	if (attackers.length < 2) {
		return '';
	}

	let foundNotPined = false;
	let foundOnSameRank = false;
	let foundOnSameFile = false;
	const rankFrom = Math.trunc(from / 16);
	const fileFrom = from % 16;
	for (let i = 0; i < attackers.length; ++i) {
		const sq = attackers[i];
		if (sq === from || isPinned(position, sq, to)) {
			continue;
		}

		foundNotPined = true;
		if (rankFrom === Math.trunc(sq / 16)) {
			foundOnSameRank = true;
		}
		if (fileFrom === sq % 16) {
			foundOnSameFile = true;
		}
	}

	if (foundOnSameFile) {
		return foundOnSameRank ? squareToString(from) : rankToString(rankFrom);
	}
	else {
		return foundNotPined ? fileToString(fileFrom) : '';
	}
}


/**
 * Whether the piece on the given square is pinned or not.
 */
function isPinned(position: PositionImpl, sq: number, aimingAtSq: number) {
	const kingSquare = position.king[position.turn];
	if (kingSquare < 0) {
		return false;
	}

	const vector = Math.abs(kingSquare - sq);
	const aimingAtVector = Math.abs(aimingAtSq - sq);

	const pinnerQueen = PieceImpl.QUEEN * 2 + 1 - position.turn;
	const pinnerRook = PieceImpl.ROOK * 2 + 1 - position.turn;
	const pinnerBishop = PieceImpl.BISHOP * 2 + 1 - position.turn;

	// Potential pinning on file or rank.
	if (vector < 8) {
		return aimingAtVector >= 8 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 1 : -1, pinnerRook, pinnerQueen);
	}
	else if (vector % 16 === 0) {
		return aimingAtVector % 16 !==0 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 16 : -16, pinnerRook, pinnerQueen);
	}

	// Potential pinning on diagonal.
	else if (vector % 15 === 0) {
		return aimingAtVector % 15 !==0 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 15 : -15, pinnerBishop, pinnerQueen);
	}
	else if (vector % 17 === 0) {
		return aimingAtVector % 17 !==0 && pinningLoockup(position, kingSquare, sq, kingSquare < sq ? 17 : -17, pinnerBishop, pinnerQueen);
	}

	// No pinning for sure.
	else {
		return false;
	}
}

function pinningLoockup(position: PositionImpl, kingSquare: number, targetSquare: number, direction: number, pinnerColoredPiece1: number, pinnerColoredPiece2: number) {
	for (let sq = kingSquare + direction; sq !== targetSquare; sq += direction) {
		if (position.board[sq] !== SpI.EMPTY) {
			return false;
		}
	}
	for (let sq = targetSquare + direction; (sq & 0x88) === 0; sq += direction) {
		if (position.board[sq] !== SpI.EMPTY) {
			return position.board[sq] === pinnerColoredPiece1 || position.board[sq] === pinnerColoredPiece2;
		}
	}
	return false;
}


/**
 * Parse a move notation for the given position.
 */
export function parseNotation(position: PositionImpl, notation: string, strict: boolean, pieceStyle: 'standard' | 'figurine') {

	// General syntax
	const m = /^(?:(O-O-O|0-0-0)|(O-O|0-0)|([A-Z\u2654-\u265f])([a-h])?([1-8])?(x)?([a-h][1-8])|(?:([a-h])(x)?)?([a-h][1-8])(?:(=)?([A-Z\u2654-\u265f]))?)([+#])?$/.exec(notation);
	if (m === null) {
		throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_MOVE_NOTATION_SYNTAX);
	}

	// Ensure that the position is legal.
	if (!isLegal(position)) {
		throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_POSITION);
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

	let descriptor: MoveDescriptorImpl | false = false;

	// Parse castling moves
	if (m[1] !== undefined || m[2] !== undefined) {
		descriptor = parseCastlingNotation(position, notation, strict, m[1], m[2]);
	}

	// Non-pawn move
	else if (m[3] !== undefined) {
		descriptor = parseNonPawnNotation(position, notation, strict, pieceStyle, m[3], m[4], m[5], m[7]);
	}

	// Pawn move
	else {
		descriptor = parsePawnMoveNotation(position, notation, strict, pieceStyle, m[8], m[10], m[11], m[12]);
	}

	// STRICT MODE
	if (strict) {
		const observedIsCapture = m[6] !== undefined || m[9] !== undefined;
		if (descriptor.isCapture() !== observedIsCapture) {
			const message = descriptor.isCapture() ? i18n.MISSING_CAPTURE_SYMBOL : i18n.INVALID_CAPTURE_SYMBOL;
			throw new InvalidNotation(getFEN(position), notation, message);
		}
		const expectedCCS = getCheckCheckmateSymbol(position, descriptor);
		const observedCCS = m[13] === undefined ? '' : m[13];
		if (expectedCCS !== observedCCS) {
			throw new InvalidNotation(getFEN(position), notation, i18n.WRONG_CHECK_CHECKMATE_SYMBOL, expectedCCS, observedCCS);
		}
	}

	// Final result
	return descriptor;
}


/**
 * Delegate function that computes the move descriptor corresponding to a castling move (corresponding notation: "O-O" or "O-O-O").
 */
function parseCastlingNotation(position: PositionImpl, notation: string, strict: boolean, queenSideCastlingSymbol: string | undefined,
	kingSideCastlingSymbol: string | undefined): MoveDescriptorImpl {

	const from = position.king[position.turn];
	if (from < 0) {
		throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_NO_KING_CASTLING);
	}

	refreshEffectiveCastling(position);
	const isKingSideCastling = kingSideCastlingSymbol !== undefined;
	const toFile = getCastlingDestinationFile(position, isKingSideCastling);
	const descriptor = toFile >= 0 ? isCastlingMoveLegal(position, from, toFile + 112 * position.turn) : false;
	if (!descriptor) {
		const message = isKingSideCastling ? i18n.ILLEGAL_KING_SIDE_CASTLING : i18n.ILLEGAL_QUEEN_SIDE_CASTLING;
		throw new InvalidNotation(getFEN(position), notation, message);
	}

	// STRICT-MODE -> ensure that upper-case O is used instead of digit 0.
	if (strict) {
		const firstChar = (isKingSideCastling ? kingSideCastlingSymbol : queenSideCastlingSymbol!).charAt(0);
		if (firstChar === '0') {
			throw new InvalidNotation(getFEN(position), notation, i18n.CASTLING_MOVE_ENCODED_WITH_ZERO);
		}
	}

	return descriptor;
}


/**
 * Returns the file of a `to` square to take into account to check whether a castling move is legal or not.
 */
function getCastlingDestinationFile(position: PositionImpl, isKingSideCastling: boolean) {
	if (position.variant === GameVariantImpl.CHESS960) {
		if (position.effectiveCastling![position.turn] !== 0) {
			const castlingKing = PieceImpl.KING * 2 + position.turn;
			for (let file = isKingSideCastling ? 7 : 0; position.board[file + 112 * position.turn] !== castlingKing; file += isKingSideCastling ? -1 : 1) {
				if ((position.effectiveCastling![position.turn] & 1 << file) !== 0) {
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
 * Delegate function that computes the move descriptor corresponding to a non-pawn move. Corresponding notation, for instance "Ne3xd5":
 *
 * - N: piece symbol
 * - e: file disambiguation
 * - 3: rank disambiguation
 * - d5: destination square
 */
function parseNonPawnNotation(position: PositionImpl, notation: string, strict: boolean, pieceStyle: 'standard' | 'figurine',
	pieceSymbol: string, fileDisambiguation: string | undefined, rankDisambiguation: string | undefined, destinationSquare: string): MoveDescriptorImpl {

	const movingColoredPiece = parsePieceSymbol(position, notation, pieceSymbol, strict, pieceStyle) * 2 + position.turn;
	const to = squareFromString(destinationSquare);
	const toContent = position.board[to];

	// Cannot take your own pieces!
	if (toContent !== SpI.EMPTY && toContent % 2 === position.turn) {
		throw new InvalidNotation(getFEN(position), notation, i18n.TRYING_TO_CAPTURE_YOUR_OWN_PIECES);
	}

	// Capture may be mandatory in some variants.
	if (toContent === SpI.EMPTY && isCaptureMandatory(position)) {
		throw new InvalidNotation(getFEN(position), notation, i18n.CAPTURE_IS_MANDATORY);
	}

	// Find the "from"-square candidates
	let attackers = getAttacks(position, to, position.turn).filter(sq => position.board[sq] === movingColoredPiece);

	// Apply disambiguation
	if (fileDisambiguation !== undefined) {
		const fileFrom = fileFromString(fileDisambiguation);
		attackers = attackers.filter(sq => sq % 16 === fileFrom);
	}
	if (rankDisambiguation !== undefined) {
		const rankFrom = rankFromString(rankDisambiguation);
		attackers = attackers.filter(sq => Math.trunc(sq / 16) === rankFrom);
	}
	if (attackers.length === 0) {
		const message = fileDisambiguation === undefined && rankDisambiguation === undefined ? i18n.NO_PIECE_CAN_MOVE_TO : i18n.NO_PIECE_CAN_MOVE_TO_DISAMBIGUATION;
		throw new InvalidNotation(getFEN(position), notation, message, pieceSymbol, destinationSquare);
	}

	// Compute the move descriptor for each remaining "from"-square candidate
	let descriptor: MoveDescriptorImpl | false = false;
	for (let i = 0; i < attackers.length; ++i) {
		if (isKingSafeAfterMove(position, attackers[i], to)) {
			if (descriptor) {
				throw new InvalidNotation(getFEN(position), notation, i18n.REQUIRE_DISAMBIGUATION, pieceSymbol, destinationSquare);
			}
			descriptor = MoveDescriptorImpl.make(attackers[i], to, movingColoredPiece, toContent);
		}
	}
	if (!descriptor) {
		const message = position.turn === ColorImpl.WHITE ? i18n.NOT_SAFE_FOR_WHITE_KING : i18n.NOT_SAFE_FOR_BLACK_KING;
		throw new InvalidNotation(getFEN(position), notation, message);
	}

	// STRICT-MODE -> check the disambiguation symbol.
	if (strict) {
		const expectedDS = getDisambiguationSymbol(position, descriptor._from, to);
		const observedDS = (fileDisambiguation === undefined ? '' : fileDisambiguation) + (rankDisambiguation === undefined ? '' : rankDisambiguation);
		if (expectedDS !== observedDS) {
			throw new InvalidNotation(getFEN(position), notation, i18n.WRONG_DISAMBIGUATION_SYMBOL, expectedDS, observedDS);
		}
	}

	return descriptor;
}


/**
 * Delegate function that computes the move descriptor corresponding to a pawn move. Corresponding notation, for instance "fxg8=Q":
 *
 * - f: origin file
 * - g8: destination square
 * - =: promotion symbol
 * - Q: promoted piece
 */
function parsePawnMoveNotation(position: PositionImpl, notation: string, strict: boolean, pieceStyle: 'standard' | 'figurine',
	originFile: string | undefined, destinationSquare: string, promotionSymbol: string | undefined, promotedPiece: string | undefined): MoveDescriptorImpl {

	const coloredPawn = PieceImpl.PAWN * 2 + position.turn;
	const to = squareFromString(destinationSquare);
	const toContent = position.board[to];
	const vector = 16 - position.turn*32;
	let from = to - vector;
	let enPassantSquare = -1;
	if (originFile !== undefined) { // Capturing pawn move

		// Ensure that `to` is not on the 1st row.
		if ((from & 0x88) !== 0) {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
		}

		// Compute the "from"-square.
		const columnFrom = fileFromString(originFile);
		const columnTo = to % 16;
		if (columnTo - columnFrom === 1) {
			from -= 1;
		}
		else if (columnTo - columnFrom === -1) {
			from += 1;
		}
		else {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
		}

		// Check the content of the "from"-square
		if (position.board[from] !== coloredPawn) {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
		}

		// Check the content of the "to"-square
		if (toContent === SpI.EMPTY) { // Look for en-passant captures
			refreshEffectiveEnPassant(position);
			if (to !== (5 - position.turn * 3) * 16 + position.effectiveEnPassant!) {
				throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
			}
			enPassantSquare = (4 - position.turn) * 16 + position.effectiveEnPassant!;
		}
		else if (toContent % 2 === position.turn) { // detecting regular captures
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
		}
	}
	else if (isCaptureMandatory(position)) {
		throw new InvalidNotation(getFEN(position), notation, i18n.CAPTURE_IS_MANDATORY);
	}
	else { // Non-capturing pawn move

		// Ensure that `to` is not on the 1st row.
		if ((from & 0x88) !== 0) {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
		}

		// Check the content of the "to"-square
		if (toContent !== SpI.EMPTY) {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
		}

		// Check the content of the "from"-square
		if (position.board[from] === SpI.EMPTY) { // Look for two-square pawn moves
			from -= vector;
			const firstSquareOfArea = position.turn * 96; // a1 for white, a7 for black (2-square pawn move is allowed from 1st row at horde chess)
			if (from < firstSquareOfArea || from >= firstSquareOfArea + 24 || position.board[from] !== coloredPawn) {
				throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
			}
		}
		else if (position.board[from] !== coloredPawn) {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
		}
	}

	// Ensure that the pawn move do not let a king in check.
	if (!isKingSafeAfterMove(position, from, to, enPassantSquare)) {
		const message = position.turn === ColorImpl.WHITE ? i18n.NOT_SAFE_FOR_WHITE_KING : i18n.NOT_SAFE_FOR_BLACK_KING;
		throw new InvalidNotation(getFEN(position), notation, message);
	}

	// Promotions
	if (to < 8 || to >= 112) {
		if (promotedPiece === undefined) {
			throw new InvalidNotation(getFEN(position), notation, i18n.MISSING_PROMOTION);
		}
		const promotion = parsePieceSymbol(position, notation, promotedPiece, strict, pieceStyle);
		if (promotion === PieceImpl.PAWN || (promotion === PieceImpl.KING && position.variant !== GameVariantImpl.ANTICHESS)) {
			throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_PROMOTED_PIECE, promotedPiece);
		}

		// STRICT MODE -> do not forget the `=` character!
		if (strict && promotionSymbol === undefined) {
			throw new InvalidNotation(getFEN(position), notation, i18n.MISSING_PROMOTION_SYMBOL);
		}

		return MoveDescriptorImpl.makePromotion(from, to, position.turn, toContent, promotion);
	}

	// Non-promotion moves
	else {
		if (promotedPiece !== undefined) { // Detect illegal promotion attempts!
			throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_PROMOTION);
		}
		return enPassantSquare >= 0 ? MoveDescriptorImpl.makeEnPassant(from, to, enPassantSquare, position.turn) : MoveDescriptorImpl.make(from, to, coloredPawn, toContent);
	}
}


/**
 * Delegate function for piece symbol parsing.
 */
function parsePieceSymbol(position: PositionImpl, notation: string, pieceSymbol: string, strict: boolean, pieceStyle: 'standard' | 'figurine') {
	switch (pieceStyle) {

		case 'figurine': {
			const coloredPieceCode = figurineFromString(pieceSymbol);
			if (coloredPieceCode < 0) {
				throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_PIECE_SYMBOL, pieceSymbol);
			}
			if (strict && coloredPieceCode % 2 !== position.turn) {
				throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_PIECE_SYMBOL_COLOR, pieceSymbol);
			}
			return Math.trunc(coloredPieceCode / 2);
		}

		case 'standard': {
			const pieceCode = pieceFromString(pieceSymbol.toLowerCase());
			if (pieceCode < 0) {
				throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_PIECE_SYMBOL, pieceSymbol);
			}
			return pieceCode;
		}
	}
}
