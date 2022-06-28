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


import { MoveDescriptor } from '../movedescriptor';
import { KING, ROOK, PAWN, colorToString, coloredPieceToString, pieceToString, squareToString } from '../basetypes';
import { IllegalArgument } from '../exception';


const CASTLING_FLAG   = 0x01;
const EN_PASSANT_FLAG = 0x02;
const CAPTURE_FLAG    = 0x04;
const PROMOTION_FLAG  = 0x08;


/**
 * Implementation of {@link MoveDescriptor}.
 */
export class MoveDescriptorImpl extends MoveDescriptor {

	/**
	 * Instantiate a normal (aka. non-en-passant, non-promotion, non-castling) move.
	 */
	static make(from: number, to: number, movingColoredPiece: number, capturedColoredPiece: number) {
		const flags = capturedColoredPiece >= 0 ? CAPTURE_FLAG : 0x00;
		return new MoveDescriptorImpl(flags, from, to, movingColoredPiece, movingColoredPiece, capturedColoredPiece, -1, -1);
	}

	/**
	 * Instantiate a castling move.
	 */
	static makeCastling(from: number, to: number, rookFrom: number, rookTo: number, color: number) {
		const movingColoredKing = KING * 2 + color;
		const movingColoredRook = ROOK * 2 + color;
		return new MoveDescriptorImpl(CASTLING_FLAG, from, to, movingColoredKing, movingColoredKing, movingColoredRook, rookFrom, rookTo);
	}

	/**
	 * Instantiate a *en-passant* capture.
	 */
	static makeEnPassant(from: number, to: number, enPassantSquare: number, color: number) {
		const flags = EN_PASSANT_FLAG | CAPTURE_FLAG;
		const movingColoredPawn = PAWN * 2 + color;
		const capturedColoredPawn = PAWN * 2 + 1 - color;
		return new MoveDescriptorImpl(flags, from, to, movingColoredPawn, movingColoredPawn, capturedColoredPawn, enPassantSquare, -1);
	}

	/**
	 * Instantiate a promotion.
	 */
	static makePromotion(from: number, to: number, color: number, capturedColoredPiece: number, promotion: number) {
		const flags = PROMOTION_FLAG | (capturedColoredPiece >= 0 ? CAPTURE_FLAG : 0x00);
		const movingColoredPawn = PAWN * 2 + color;
		const finalColoredPiece = promotion * 2 + color;
		return new MoveDescriptorImpl(flags, from, to, movingColoredPawn, finalColoredPiece, capturedColoredPiece, -1, -1);
	}

	_flags: number;
	_from: number;
	_to: number;
	_movingColoredPiece: number;
	_finalColoredPiece: number;
	_optionalColoredPiece: number; // Captured (colored) piece in case of capture, moving (colored) rook in case of castling.
	_optionalSquare1: number;      // Rook-from or en-passant square.
	_optionalSquare2: number;      // Rook-to.

	private constructor(flags: number, from: number, to: number, movingColoredPiece: number, finalColoredPiece: number, optionalColoredPiece: number,
		optionalSquare1: number, optionalSquare2: number) {
		super();
		this._flags = flags;
		this._from = from;
		this._to = to;
		this._movingColoredPiece = movingColoredPiece;
		this._finalColoredPiece = finalColoredPiece;
		this._optionalColoredPiece = optionalColoredPiece; // Captured (colored) piece in case of capture, moving (colored) rook in case of castling.
		this._optionalSquare1 = optionalSquare1;    // Rook-from or en-passant square.
		this._optionalSquare2 = optionalSquare2;    // Rook-to.
	}

	isCastling() {
		return (this._flags & CASTLING_FLAG) !== 0;
	}

	isEnPassant() {
		return (this._flags & EN_PASSANT_FLAG) !== 0;
	}

	isCapture() {
		return (this._flags & CAPTURE_FLAG) !== 0;
	}

	isPromotion() {
		return (this._flags & PROMOTION_FLAG) !== 0;
	}

	from() {
		return squareToString(this._from);
	}

	to() {
		return squareToString(this._to);
	}

	color() {
		return colorToString(this._movingColoredPiece % 2);
	}

	movingPiece() {
		return pieceToString(Math.trunc(this._movingColoredPiece / 2));
	}

	movingColoredPiece() {
		return coloredPieceToString(this._movingColoredPiece);
	}

	capturedPiece() {
		if (!this.isCapture()) {
			throw new IllegalArgument('MoveDescriptor.capturedPiece()');
		}
		return pieceToString(Math.trunc(this._optionalColoredPiece / 2));
	}

	capturedColoredPiece() {
		if (!this.isCapture()) {
			throw new IllegalArgument('MoveDescriptor.capturedColoredPiece()');
		}
		return coloredPieceToString(this._optionalColoredPiece);
	}

	rookFrom() {
		if (!this.isCastling()) {
			throw new IllegalArgument('MoveDescriptor.rookFrom()');
		}
		return squareToString(this._optionalSquare1);
	}

	rookTo() {
		if (!this.isCastling()) {
			throw new IllegalArgument('MoveDescriptor.rookTo()');
		}
		return squareToString(this._optionalSquare2);
	}

	enPassantSquare() {
		if (!this.isEnPassant()) {
			throw new IllegalArgument('MoveDescriptor.enPassantSquare()');
		}
		return squareToString(this._optionalSquare1);
	}

	promotion() {
		if (!this.isPromotion()) {
			throw new IllegalArgument('MoveDescriptor.promotion()');
		}
		return pieceToString(Math.trunc(this._finalColoredPiece / 2));
	}

	coloredPromotion() {
		if (!this.isPromotion()) {
			throw new IllegalArgument('MoveDescriptor.coloredPromotion()');
		}
		return coloredPieceToString(this._finalColoredPiece);
	}
}
