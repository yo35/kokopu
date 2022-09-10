/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2022  Yoann Le Montagner <yo35 -at- melix.net>       *
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
 * -------------------------------------------------------------------------- */


import { ATTACK_DIRECTIONS, isAttacked } from './attacks';
import { ColorImpl, PieceImpl, SpI, GameVariantImpl } from './base_types_impl';
import { PositionImpl } from './impl';
import { isLegal, isKingSafeAfterMove, refreshEffectiveEnPassant } from './legality';
import { MoveDescriptorImpl } from './move_descriptor_impl';

import { MoveDescriptor } from '../move_descriptor';


/* eslint-disable no-mixed-spaces-and-tabs, indent */

/**
 * Displacement lookup per square index difference.
 */
const DISPLACEMENT_LOOKUP = [
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

/**
 * Sliding direction
 */
const SLIDING_DIRECTION = [
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


/**
 * Whether there is at least one piece with the given color in the given position.
 */
function hasAtLeastOnePiece(position: PositionImpl, color: number) {
	for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
		if (position.board[sq] !== SpI.EMPTY && position.board[sq] % 2 === color) {
			return true;
		}
	}
	return false;
}


/**
 * Return `true` if the king of the player to play HAS ROYAL POWER and IS ATTACKED.
 */
function isKingToMoveAttacked(position: PositionImpl) {
	return position.king[position.turn] >= 0 && isAttacked(position, position.king[position.turn], 1 - position.turn);
}


/**
 * Whether the given position is legal and the player to play is in check.
 */
export function isCheck(position: PositionImpl) {
	return isLegal(position) && isKingToMoveAttacked(position);
}


/**
 * Whether the given position is legal and the player to play is checkmated.
 */
export function isCheckmate(position: PositionImpl) {
	if (!isLegal(position) || hasMove(position)) {
		return false;
	}
	if (position.variant === GameVariantImpl.ANTICHESS) {
		return true;
	}
	else if (position.variant === GameVariantImpl.HORDE && position.turn === ColorImpl.WHITE) {
		return !hasAtLeastOnePiece(position, ColorImpl.WHITE);
	}
	else {
		return isKingToMoveAttacked(position);
	}
}


/**
 * Whether the given position is legal and the player to play is stalemated.
 */
export function isStalemate(position: PositionImpl) {
	if (!isLegal(position) || hasMove(position)) {
		return false;
	}
	if (position.variant === GameVariantImpl.ANTICHESS) {
		return true;
	}
	else if (position.variant === GameVariantImpl.HORDE && position.turn === ColorImpl.WHITE) {
		return hasAtLeastOnePiece(position, ColorImpl.WHITE);
	}
	else {
		return !isKingToMoveAttacked(position);
	}
}


/**
 * Whether there is at least 1 possible move in the given position.
 *
 * @returns `false` if the position is not legal.
 */
export function hasMove(position: PositionImpl) {
	class MoveFound {}
	try {
		generateMoves(position, () => { throw new MoveFound(); });
		return false;
	}
	catch(err) {
		// istanbul ignore else
		if (err instanceof MoveFound) {
			return true;
		}
		else {
			throw err;
		}
	}
}


/**
 * Return all the legal moves in the given position.
 */
export function moves(position: PositionImpl) {
	const result: MoveDescriptor[] = [];
	generateMoves(position, moveDescriptor => { result.push(moveDescriptor); });
	return result;
}


/**
 * Generate all the legal moves of the given position.
 */
function generateMoves(position: PositionImpl, moveDescriptorConsumer: (moveDescriptor: MoveDescriptorImpl) => void) {

	// Ensure that the position is legal.
	if (!isLegal(position)) {
		return;
	}

	// In some variants, capture may be mandatory (typically in antichess).
	const nonCaptureIsAllowed = !isCaptureMandatory(position);

	// Generate en-passant captures
	refreshEffectiveEnPassant(position);
	if (position.effectiveEnPassant! >= 0) {
		const square3 = (5 - position.turn * 3) * 16 + position.effectiveEnPassant!;
		const square4 = (4 - position.turn    ) * 16 + position.effectiveEnPassant!;
		const capturingPawn = PieceImpl.PAWN * 2 + position.turn;
		if (((square4 - 1) & 0x88) === 0 && position.board[square4 - 1] === capturingPawn && isKingSafeAfterMove(position, square4 - 1, square3, square4)) {
			moveDescriptorConsumer(MoveDescriptorImpl.makeEnPassant(square4 - 1, square3, square4, position.turn));
		}
		if (((square4 + 1) & 0x88) === 0 && position.board[square4 + 1] === capturingPawn && isKingSafeAfterMove(position, square4 + 1, square3, square4)) {
			moveDescriptorConsumer(MoveDescriptorImpl.makeEnPassant(square4 + 1, square3, square4, position.turn));
		}
	}

	// For all potential 'from' square...
	for (let from = 0; from < 120; from += (from & 0x7) === 7 ? 9 : 1) {

		// Nothing to do if the current square does not contain a piece of the right color.
		const fromContent = position.board[from];
		const movingPiece = Math.trunc(fromContent / 2);
		if (fromContent === SpI.EMPTY || fromContent % 2 !== position.turn) {
			continue;
		}

		// Generate moves for pawns
		if (movingPiece === PieceImpl.PAWN) {

			// Regular capturing moves (en-passant not handled here)
			const attackDirections = ATTACK_DIRECTIONS[fromContent];
			for (let i = 0; i < attackDirections.length; ++i) {
				const to = from + attackDirections[i];
				if ((to & 0x88) === 0 && position.board[to] !== SpI.EMPTY && position.board[to] % 2 !== position.turn && isKingSafeAfterMove(position, from, to)) {
					generateRegularPawnMoveOrPromotion(position, from, to, moveDescriptorConsumer);
				}
			}

			// Non-capturing moves
			if (nonCaptureIsAllowed) {
				const moveDirection = 16 - position.turn * 32;
				let to = from + moveDirection;
				if (position.board[to] === SpI.EMPTY) {
					if (isKingSafeAfterMove(position, from, to)) {
						generateRegularPawnMoveOrPromotion(position, from, to, moveDescriptorConsumer);
					}

					// 2-square pawn move
					const firstSquareOfArea = position.turn * 96; // a1 for white, a7 for black (2-square pawn move is allowed from 1st row at horde chess)
					if (from >= firstSquareOfArea && from < firstSquareOfArea + 24) {
						to += moveDirection;
						if (position.board[to] === SpI.EMPTY && isKingSafeAfterMove(position, from, to)) {
							moveDescriptorConsumer(MoveDescriptorImpl.make(from, to, fromContent, SpI.EMPTY));
						}
					}
				}
			}
		}

		// Generate moves for non-sliding non-pawn pieces
		else if (movingPiece === PieceImpl.KNIGHT || movingPiece === PieceImpl.KING) {
			const directions = ATTACK_DIRECTIONS[fromContent];
			for (let i = 0; i < directions.length; ++i) {
				const to = from + directions[i];
				if ((to & 0x88) === 0) {
					const toContent = position.board[to];
					if ((toContent === SpI.EMPTY ? nonCaptureIsAllowed : toContent % 2 !== position.turn) && isKingSafeAfterMove(position, from, to)) {
						moveDescriptorConsumer(MoveDescriptorImpl.make(from, to, fromContent, toContent));
					}
				}
			}
		}

		// Generate moves for sliding pieces
		else {
			const directions = ATTACK_DIRECTIONS[fromContent];
			for (let i = 0; i < directions.length; ++i) {
				for (let to = from + directions[i]; (to & 0x88) === 0; to += directions[i]) {
					const toContent = position.board[to];
					if ((toContent === SpI.EMPTY ? nonCaptureIsAllowed : toContent % 2 !== position.turn) && isKingSafeAfterMove(position, from, to)) {
						moveDescriptorConsumer(MoveDescriptorImpl.make(from, to, fromContent, toContent));
					}
					if (toContent !== SpI.EMPTY) {
						break;
					}
				}
			}
		}

		// Generate castling moves
		if (movingPiece === PieceImpl.KING && nonCaptureIsAllowed && position.castling[position.turn] !== 0) {
			if (position.variant === GameVariantImpl.CHESS960) {
				for (let file = 0; file < 8; ++file) {
					const castlingDescriptor = isCastlingLegal(position, from, file + 112 * position.turn);
					if (castlingDescriptor) {
						moveDescriptorConsumer(castlingDescriptor);
					}
				}
			}
			else {
				const queenSideCastlingDescriptor = isCastlingLegal(position, from, 2 + 112 * position.turn);
				if (queenSideCastlingDescriptor) {
					moveDescriptorConsumer(queenSideCastlingDescriptor);
				}
				const kingSideCastlingDescriptor = isCastlingLegal(position, from, 6 + 112 * position.turn);
				if (kingSideCastlingDescriptor) {
					moveDescriptorConsumer(kingSideCastlingDescriptor);
				}
			}
		}
	}
}


/**
 * Generate the move descriptors corresponding to a pawn move from `from` to `to`, excluding 2-square pawn moves and en-passant captures.
 */
function generateRegularPawnMoveOrPromotion(position: PositionImpl, from: number, to: number, moveDescriptorConsumer: (moveDescriptor: MoveDescriptorImpl) => void) {
	const toContent = position.board[to];
	if (to < 8 || to >= 112) {
		moveDescriptorConsumer(MoveDescriptorImpl.makePromotion(from, to, position.turn, toContent, PieceImpl.QUEEN));
		moveDescriptorConsumer(MoveDescriptorImpl.makePromotion(from, to, position.turn, toContent, PieceImpl.ROOK));
		moveDescriptorConsumer(MoveDescriptorImpl.makePromotion(from, to, position.turn, toContent, PieceImpl.BISHOP));
		moveDescriptorConsumer(MoveDescriptorImpl.makePromotion(from, to, position.turn, toContent, PieceImpl.KNIGHT));
		if (position.variant === GameVariantImpl.ANTICHESS) {
			moveDescriptorConsumer(MoveDescriptorImpl.makePromotion(from, to, position.turn, toContent, PieceImpl.KING));
		}
	}
	else {
		moveDescriptorConsumer(MoveDescriptorImpl.make(from, to, PieceImpl.PAWN * 2 + position.turn, toContent));
	}
}


/**
 * For antichess, return `true` if the current player can capture something. For other variants, always returns `false`.
 *
 * Precondition: the position must be legal.
 */
export function isCaptureMandatory(position: PositionImpl) {
	if (position.variant !== GameVariantImpl.ANTICHESS) {
		return false;
	}

	// Look for regular captures
	for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
		const cp = position.board[sq];
		if (cp !== SpI.EMPTY && cp % 2 !== position.turn && isAttacked(position, sq, position.turn)) {
			return true;
		}
	}

	// Look for "en-passant" captures
	refreshEffectiveEnPassant(position);
	if (position.effectiveEnPassant! >= 0) {
		return true;
	}

	return false;
}


/**
 * Delegated method for checking whether a castling move is legal or not. WARNING: in case of Chess960, `to` represents the origin square of the rook (KxR).
 */
export function isCastlingLegal(position: PositionImpl, from: number, to: number): MoveDescriptorImpl | false {

	let rookFrom = -1;
	let rookTo = -1;

	// Validate `from` and `to`, check the castling flags, and compute the origin and destination squares of the rook.
	if (position.variant === GameVariantImpl.CHESS960) {
		const castleFile = to % 16;
		const castleRank = Math.trunc(to / 16);
		if (castleRank !== position.turn * 7 || (position.castling[position.turn] & (1 << castleFile)) === 0) {
			return false;
		}
		rookFrom = to;
		rookTo = (from > to ? 3 : 5) + 112 * position.turn;
		to = (from > to ? 2 : 6) + 112 * position.turn;
	}
	else if (to === 2 + position.turn * 112) { // queen-side castling
		if ((position.castling[position.turn] & 1) === 0) {
			return false;
		}
		rookFrom = 112 * position.turn;
		rookTo = 3 + 112 * position.turn;
	}
	else if (to === 6 + position.turn*112) { // king-side castling
		if ((position.castling[position.turn] & (1 << 7)) === 0) {
			return false;
		}
		rookFrom = 7 + 112 * position.turn;
		rookTo = 5 + 112 * position.turn;
	}
	else {
		return false;
	}

	// Free the king and rook square (mandatory for attack detection).
	position.board[from] = SpI.EMPTY;
	position.board[rookFrom] = SpI.EMPTY;
	try {

		// Ensure that each square on the trajectory is empty.
		for (let sq = Math.min(from, to, rookFrom, rookTo); sq <= Math.max(from, to, rookFrom, rookTo); ++sq) {
			if (position.board[sq] !== SpI.EMPTY) {
				return false;
			}
		}

		// The origin and destination squares of the king, and the square between them must not be attacked.
		const byWho = 1 - position.turn;
		for (let sq = Math.min(from, to); sq <= Math.max(from, to); ++sq) {
			if (isAttacked(position, sq, byWho)) {
				return false;
			}
		}

		// The move is legal -> generate the move descriptor.
		return MoveDescriptorImpl.makeCastling(from, to, rookFrom, rookTo, position.turn);
	}
	finally {
		position.board[from] = PieceImpl.KING * 2 + position.turn;
		position.board[rookFrom] = PieceImpl.ROOK * 2 + position.turn;
	}
}


/**
 * Core algorithm to determine whether a move is legal or not. The verification flow is the following:
 *
 *  1. Ensure that the position itself is legal.
 *  2. Ensure that the origin square contains a piece (denoted as the moving-piece)
 *     whose color is the same than the color of the player about to play.
 *  3. Special routine for castling detection.
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
 */
export function isMoveLegal(position: PositionImpl, from: number, to: number): RegularMoveDescriptor | PromotionMoveDescriptor | false {

	// Step (1)
	if (!isLegal(position)) {
		return false;
	}

	// Step (2)
	const fromContent = position.board[from];
	const toContent = position.board[to];
	const movingPiece = Math.trunc(fromContent / 2);
	if (fromContent === SpI.EMPTY || fromContent % 2 !== position.turn) {
		return false;
	}

	// Miscellaneous variables
	const displacement = to - from + 119;
	let enPassantSquare = -1; // square where a pawn is taken if the move is "en-passant"
	let isTwoSquarePawnMove = false;
	const isPromotion = movingPiece === PieceImpl.PAWN && (to < 8 || to >= 112);
	const captureIsMandatory = isCaptureMandatory(position);

	// Step (3) - Castling detection.
	if (movingPiece === PieceImpl.KING && !captureIsMandatory && position.castling[position.turn] !== 0) {
		const castlingDescriptor = isCastlingLegal(position, from, to);
		if (castlingDescriptor) {
			return {
				type: 'regular',
				moveDescriptor: castlingDescriptor,
			};
		}
	}

	// Step (4)
	if ((DISPLACEMENT_LOOKUP[displacement] & 1 << fromContent) === 0) {
		if (movingPiece === PieceImpl.PAWN && displacement === 151 - position.turn * 64) {
			const firstSquareOfArea = position.turn * 96; // a1 for white, a7 for black (2-square pawn move is allowed from 1st row at horde chess)
			if (from < firstSquareOfArea || from >= firstSquareOfArea + 24) {
				return false;
			}
			isTwoSquarePawnMove = true;
		}
		else {
			return false;
		}
	}

	// Step (5) -> check the content of the destination square
	if (movingPiece === PieceImpl.PAWN) {
		refreshEffectiveEnPassant(position);
		if (displacement === 135 - position.turn * 32 || isTwoSquarePawnMove) { // non-capturing pawn move
			if (captureIsMandatory || toContent !== SpI.EMPTY) {
				return false;
			}
		}
		else if (toContent === SpI.EMPTY) { // en-passant pawn move
			if (to !== (5 - position.turn * 3) * 16 + position.effectiveEnPassant!) {
				return false;
			}
			enPassantSquare = (4 - position.turn) * 16 + position.effectiveEnPassant!;
		}
		else { // regular capturing pawn move
			if (toContent % 2 === position.turn) {
				return false;
			}
		}
	}
	else { // piece move
		if (toContent === SpI.EMPTY ? captureIsMandatory : toContent % 2 === position.turn) {
			return false;
		}
	}

	// Step (6) -> For sliding pieces, ensure that there is nothing between the origin and the destination squares.
	if (movingPiece === PieceImpl.BISHOP || movingPiece === PieceImpl.ROOK || movingPiece === PieceImpl.QUEEN) {
		const direction = SLIDING_DIRECTION[displacement];
		for (let sq = from + direction; sq !== to; sq += direction) {
			if (position.board[sq] !== SpI.EMPTY) {
				return false;
			}
		}
	}
	else if (isTwoSquarePawnMove) { // two-square pawn moves also require this test.
		if (position.board[(from + to) / 2] !== SpI.EMPTY) {
			return false;
		}
	}

	// Steps (7) to (9) are delegated to `isKingSafeAfterMove`.
	if (!isKingSafeAfterMove(position, from, to, enPassantSquare)) {
		return false;
	}
	if (isPromotion) {
		return {
			type: 'promotion',
			moveDescriptorFactory: buildPromotionMoveDescriptor(from, to, position.variant, position.turn, toContent),
		};
	}
	else {
		return {
			type: 'regular',
			moveDescriptor: enPassantSquare >= 0 ? MoveDescriptorImpl.makeEnPassant(from, to, enPassantSquare, position.turn) :
				MoveDescriptorImpl.make(from, to, fromContent, toContent),
		};
	}
}

interface RegularMoveDescriptor {
	type: 'regular',
	moveDescriptor: MoveDescriptorImpl,
}

interface PromotionMoveDescriptor {
	type: 'promotion',
	moveDescriptorFactory: (promotion: number) => MoveDescriptorImpl | false,
}

function buildPromotionMoveDescriptor(from: number, to: number, variant: number, color: number, capturedColoredPiece: number): (promotion: number) => MoveDescriptorImpl | false {
	return promotion => {
		if (promotion === PieceImpl.PAWN || (promotion === PieceImpl.KING && variant !== GameVariantImpl.ANTICHESS)) {
			return false;
		}
		return MoveDescriptorImpl.makePromotion(from, to, color, capturedColoredPiece, promotion);
	};
}


/**
 * Play the move corresponding to the given descriptor.
 */
export function play(position: PositionImpl, descriptor: MoveDescriptorImpl) {

	// Update the board.
	position.board[descriptor._from] = SpI.EMPTY; // WARNING: update `from` before `to` in case both squares are actually the same!
	if (descriptor.isEnPassant()) {
		position.board[descriptor._optionalSquare1] = SpI.EMPTY;
	}
	else if (descriptor.isCastling()) {
		position.board[descriptor._optionalSquare1] = SpI.EMPTY;
		position.board[descriptor._optionalSquare2] = descriptor._optionalColoredPiece;
	}
	position.board[descriptor._to] = descriptor._finalColoredPiece;

	const movingPiece = Math.trunc(descriptor._movingColoredPiece / 2);

	// Update the castling flags.
	if (movingPiece === PieceImpl.KING) {
		position.castling[position.turn] = 0;
	}
	if (descriptor._from <    8) { position.castling[ColorImpl.WHITE] &= ~(1 <<  descriptor._from    ); }
	if (descriptor._to   <    8) { position.castling[ColorImpl.WHITE] &= ~(1 <<  descriptor._to      ); }
	if (descriptor._from >= 112) { position.castling[ColorImpl.BLACK] &= ~(1 << (descriptor._from % 16)); }
	if (descriptor._to   >= 112) { position.castling[ColorImpl.BLACK] &= ~(1 << (descriptor._to   % 16)); }

	// Update the en-passant flag.
	position.enPassant = -1;
	position.effectiveEnPassant = -1;
	if (movingPiece === PieceImpl.PAWN && Math.abs(descriptor._from - descriptor._to) === 32) {
		const firstSquareOf2ndRow = (1 + 5 * position.turn) * 16;
		if (descriptor._from >= firstSquareOf2ndRow && descriptor._from < firstSquareOf2ndRow + 8) {
			const otherPawn = descriptor._movingColoredPiece ^ 0x01;
			if (
				(((descriptor._to - 1) & 0x88) === 0 && position.board[descriptor._to - 1] === otherPawn) ||
				(((descriptor._to + 1) & 0x88) === 0 && position.board[descriptor._to + 1] === otherPawn)
			) {
				position.enPassant = descriptor._to % 16;
				position.effectiveEnPassant = null; // Only geometric conditions have been validated so far.
			}
		}
	}

	// Update the computed flags.
	if (movingPiece === PieceImpl.KING && position.king[position.turn] >= 0) {
		position.king[position.turn] = descriptor._to;
	}

	// Toggle the turn flag.
	position.turn = 1 - position.turn;
}


/**
 * Determine if a null-move (i.e. switching the player about to play) can be played in the current position.
 * A null-move is possible if the position is legal and if the current player about to play is not in check.
 */
export function isNullMoveLegal(position: PositionImpl) {
	return isLegal(position) && !isKingToMoveAttacked(position);
}


/**
 * Play a null-move on the current position if it is legal.
 *
 * @returns `true` if the null-move has actually been played.
 */
export function playNullMove(position: PositionImpl) {
	if (isNullMoveLegal(position)) {
		position.turn = 1 - position.turn;
		position.enPassant = -1;
		position.effectiveEnPassant = -1;
		return true;
	}
	else {
		return false;
	}
}
