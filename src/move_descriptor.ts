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


import { Color, ColoredPiece, Piece, Square } from './base_types';


/**
 * Describe a legal chess move, with its characteristics.
 */
export abstract class MoveDescriptor {

	/**
	 * @ignore
	 */
	protected constructor() {}

	/**
	 * Whether the current move is a castling move or not.
	 */
	abstract isCastling(): boolean;

	/**
	 * Whether the current move is a *en-passant* capture or not.
	 */
	abstract isEnPassant(): boolean;

	/**
	 * Whether the current move is a capture (either a regular capture or a *en-passant* capture) or not.
	 */
	abstract isCapture(): boolean;

	/**
	 * Whether the current move is a promotion or not.
	 */
	abstract isPromotion(): boolean;

	/**
	 * Origin square of the moving piece. In case of castling, this is the origin square of the king.
	 */
	abstract from(): Square;

	/**
	 * Destination square of the moving piece. In case of castling, this is the destination square of the king.
	 */
	abstract to(): Square;

	/**
	 * Color of the moving piece.
	 */
	abstract color(): Color;

	/**
	 * Type of the moving piece. In case of castling, the moving piece is considered to be the king.
	 */
	abstract movingPiece(): Piece;

	/**
	 * Color and type of the moving piece. In case of castling, the moving piece is considered to be the king.
	 */
	abstract movingColoredPiece(): ColoredPiece;

	/**
	 * Type of the captured piece. An exception is thrown
	 *
	 * @throws {@link IllegalArgument} If the current move is not a capture, i.e. if {@link isCapture} returns `false`.
	 */
	abstract capturedPiece(): Piece;

	/**
	 * Color and type of the captured piece.
	 *
	 * @throws {@link IllegalArgument} If the current move is not a capture, i.e. if {@link isCapture} returns `false`.
	 */
	abstract capturedColoredPiece(): ColoredPiece;

	/**
	 * Origin square of the rook, in case of a castling move.
	 *
	 * @throws {@link IllegalArgument} If the current move is not a castling move, i.e. if {@link isCastling} returns `false`.
	 */
	abstract rookFrom(): Square;

	/**
	 * Destination square of the rook, in case of a castling move.
	 *
	 * @throws {@link IllegalArgument} If the current move is not a castling move, i.e. if {@link isCastling} returns `false`.
	 */
	abstract rookTo(): Square;

	/**
	 * Square containing the captured pawn, in case of a *en-passant* capture.
	 *
	 * @throws {@link IllegalArgument} If the current move is not a *en-passant* capture, i.e. if {@link isEnPassant} returns `false`.
	 */
	abstract enPassantSquare(): Square;

	/**
	 * Type of the promoted piece, in case of a promotion.
	 *
	 * @throws {@link IllegalArgument} If the current move is not a promotion, i.e. if {@link isPromotion} returns `false`.
	 */
	abstract promotion(): Piece;
	
	/**
	 * Color and type of the promoted piece, in case of a promotion.
	 *
	 * @throws {@link IllegalArgument} If the current move is not a promotion, i.e. if {@link isPromotion} returns `false`.
	 */
	abstract coloredPromotion(): ColoredPiece;

	/**
	 * @ignore
	 */
	toString(): string {
		let result = this.from() + this.to();
		if (this.isPromotion()) {
			result += this.promotion().toUpperCase();
		}
		else if (this.isCastling()) {
			result += 'O';
		}
		return result;
	}
}


/**
 * @deprecated Use `obj instanceof MoveDescriptor` instead.
 */
export function isMoveDescriptor(obj: any): boolean {
	return obj instanceof MoveDescriptor;
}
