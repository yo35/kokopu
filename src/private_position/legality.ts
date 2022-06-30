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


import { isAttacked } from './attacks';
import { ColorImpl, PieceImpl, CpI, SpI, SquareImpl, GameVariantImpl } from './base_types_impl';
import { PositionImpl } from './impl';


/**
 * Check whether the given position is legal or not.
 *
 * See {@link Position.isLegal} for the description of the check points enforced in this function.
 */
export function isLegal(position: PositionImpl): boolean {
	refreshLegalFlagAndKingSquares(position);
	return position.legal!;
}


/**
 * Refresh the legal flag of the given position if it is set to null
 * (which means that the legality state of the position is unknown).
 *
 * Together with the legal flag, the reference to the squares where the white and
 * black kings lie is updated by this function.
 */
export function refreshLegalFlagAndKingSquares(position: PositionImpl) {
	if (position.legal !== null) {
		return;
	}
	position.legal = false;

	// Condition (1)
	const whiteKingOK = refreshKingSquare(position, ColorImpl.WHITE);
	const blackKingOK = refreshKingSquare(position, ColorImpl.BLACK);
	if (!whiteKingOK || !blackKingOK) {
		return;
	}

	// Extension of (1) for variants that allow a player to have no piece at all...
	if (position.variant === GameVariantImpl.ANTICHESS) {
		if (!hasAtLeastOnePiece(position, 1 - position.turn)) { // The player that has just played must have at least one piece in antichess.
			return;
		}
	}
	else if (position.variant === GameVariantImpl.HORDE) {
		if (position.turn === ColorImpl.BLACK && !hasAtLeastOnePiece(position, ColorImpl.WHITE)) { // White must have at least one piece if he/she has just played in horde chess.
			return;
		}
	}

	// Condition (2)
	if (position.king[1 - position.turn] >= 0 && isAttacked(position, position.king[1 - position.turn], position.turn)) {
		return;
	}

	// Condition (3)
	const forbiddenCPWhite1 = position.variant === GameVariantImpl.HORDE ? SpI.INVALID : CpI.WP;
	for (let c = 0; c < 8; ++c) {
		const cp1 = position.board[SquareImpl.A1 + c];
		const cp8 = position.board[SquareImpl.A8 + c];
		if (cp1 === forbiddenCPWhite1 || cp8 === CpI.WP || cp1 === CpI.BP || cp8 === CpI.BP) {
			return;
		}
	}

	// Condition (4)
	const isCastlingFlagLegalFun = position.variant === GameVariantImpl.CHESS960 ? isCastlingFlagLegalForChess960 : isCastlingFlagLegalForRegularChess;
	for (let color = 0; color < 2; ++color) {
		if (!isCastlingFlagLegalFun(position, color)) {
			return;
		}
	}

	// Condition (5)
	if (position.enPassant >= 0) {
		const square2 = (6 - position.turn * 5) * 16 + position.enPassant;
		const square3 = (5 - position.turn * 3) * 16 + position.enPassant;
		const square4 = (4 - position.turn    ) * 16 + position.enPassant;
		if (position.board[square2] !== SpI.EMPTY || position.board[square3] !== SpI.EMPTY || position.board[square4] !== PieceImpl.PAWN * 2 + 1 - position.turn) {
			return;
		}
	}

	// At this point, all the conditions (1) to (6) hold, so the position can be flagged as legal.
	position.legal = true;
}


/**
 * Detect the kings of the given color that are present on the chess board.
 *
 * @returns `true` if the number of found king(s) corresponds is compatible with a legal position according to the given variant. 
 */
function refreshKingSquare(position: PositionImpl, color: number) {
	const target = PieceImpl.KING * 2 + color;
	position.king[color] = -1;

	// Expectation: king may be present (even several times), and it has no royal power.
	if (position.variant === GameVariantImpl.ANTICHESS) {
		return true;
	}

	// Expectation: no king of the given color is supposed to be present on the board.
	else if (position.variant === GameVariantImpl.NO_KING || position.variant === GameVariantImpl.BLACK_KING_ONLY - color ||
		(position.variant === GameVariantImpl.HORDE && color === ColorImpl.WHITE)) {
		for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
			if (position.board[sq] === target) {
				return false;
			}
		}
		return true;
	}

	// Expectation: exactly 1 king of the given color is supposed to be present on the board, and it has royal power.
	else {
		for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
			if (position.board[sq] === target) {

				// If the targeted king is detected on the square sq, two situations may occur:
				// 1) No king was detected on the previously visited squares: then the current
				//    square is saved, and loop over the next board squares goes on.
				if (position.king[color] < 0) {
					position.king[color] = sq;
				}

				// 2) Another king was detected on the previously visited squares: then the buffer position.king[color]
				//    is set to the invalid state (-1), and the loop is interrupted.
				else {
					position.king[color] = -1;
					return false;
				}
			}
		}
		return position.king[color] >= 0;
	}
}


/**
 * Detect whether the player with the given color has at least one piece or not.
 */
function hasAtLeastOnePiece(position: PositionImpl, color: number) {
	for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
		if (position.board[sq] >= 0 && position.board[sq] % 2 === color) {
			return true;
		}
	}
	return false;
}


function isCastlingFlagLegalForRegularChess(position: PositionImpl, color: number) {
	if (position.king[color] < 0) {
		return position.castling[color] === 0;
	}
	const skipOO  = (position.castling[color] & 0x80) === 0;
	const skipOOO = (position.castling[color] & 0x01) === 0;
	const rookHOK = skipOO              || position.board[7 + 112 * color] === PieceImpl.ROOK * 2 + color;
	const rookAOK = skipOOO             || position.board[0 + 112 * color] === PieceImpl.ROOK * 2 + color;
	const kingOK  = (skipOO && skipOOO) || position.board[4 + 112 * color] === PieceImpl.KING * 2 + color;
	return kingOK && rookAOK && rookHOK;
}


function isCastlingFlagLegalForChess960(position: PositionImpl, color: number) {
	const files: number[] = [];
	for (let file = 0; file < 8; ++file) {
		if ((position.castling[color] & 1 << file) === 0) {
			continue;
		}

		// Ensure there is a rook on each square for which the corresponding file flag is set.
		if (position.board[file + 112 * color] !== PieceImpl.ROOK * 2 + color) {
			return false;
		}
		files.push(file);
	}

	// Additional check on the king position, depending on the number of file flags.
	switch(files.length) {
		case 0: return true;

		// 1 possible castle -> ensure the king is on the initial rank.
		case 1: return position.king[color] >= 112 * color && position.king[color] <= 7 + 112 * color;

		// 2 possible castles -> ensure the king is between the two rooks.
		case 2: return position.king[color] > files[0] + 112 * color && position.king[color] < files[1] + 112 * color;

		default: return false;
	}
}