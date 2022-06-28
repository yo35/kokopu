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


import { KING, ROOK, EMPTY, CHESS960, pieceFromString, squareFromString } from './base_types_impl';
import { getFEN } from './fen';
import { PositionImpl } from './impl';
import { isLegal } from './legality';
import { MoveDescriptorImpl } from './move_descriptor_impl';
import { isMoveLegal } from './move_generation';

import { InvalidNotation } from '../exception';
import i18n = require('../i18n'); // TODO fix import


/**
 * Convert the given move descriptor to UCI notation.
 */
export function getUCINotation(position: PositionImpl, descriptor: MoveDescriptorImpl, forceKxR: boolean) {
	let result = descriptor.from();

	if (descriptor.isCastling()) {
		result += forceKxR || position.variant === CHESS960 ? descriptor.rookFrom() : descriptor.to();
	}
	else {
		result += descriptor.to();
	}

	if(descriptor.isPromotion()) {
		result += descriptor.promotion();
	}

	return result;
}


/**
 * Parse a UCI notation for the given position.
 */
export function parseUCINotation(position: PositionImpl, notation: string, strict: boolean) {

	// General syntax
	const m = /^([a-h][1-8])([a-h][1-8])([kqrbnp]?)$/.exec(notation);
	if (m === null) {
		throw new InvalidNotation(getFEN(position), notation, i18n.INVALID_UCI_NOTATION_SYNTAX);
	}

	// Ensure that the position is legal (this is also done in `moveGeneration.isMoveLegal(..)`, but performing this check beforehand
	// allows to fill the exception with an error message that is more explicit).
	if (!isLegal(position)) {
		throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_POSITION);
	}

	// m[1] - from
	// m[2] - to
	// m[3] - promotion piece

	const from = squareFromString(m[1]);
	let to = squareFromString(m[2]);
	let kxRSubstitutionApplied = false;
	let expectedRookFrom = -1; // >= 0 only if KxR substitution has been applied.

	// For non-Chess960 variants, if KxR is detected (and allowed), replace the given `to` square
	// by the actual destination square of the king.
	if (position.variant !== CHESS960 && !strict && position.board[from] !== EMPTY && position.board[to] !== EMPTY && position.board[from] % 2 === position.board[to] % 2) {
		const fromPiece = Math.trunc(position.board[from] / 2);
		const toPiece = Math.trunc(position.board[to] / 2);
		if (fromPiece === KING && toPiece === ROOK) {
			kxRSubstitutionApplied = true;
			expectedRookFrom = to;
			to = position.turn * 112 + (from < to ? 6 : 2);
		}
	}

	// Perform move analysis.
	const candidate = isMoveLegal(position, from, to);
	let result: MoveDescriptorImpl | false = false;

	// No legal move.
	if (!candidate) {
		throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_UCI_MOVE);
	}

	// Manage promotion.
	if (candidate.type === 'promotion') {
		if (m[3] === '') {
			throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_UCI_MOVE);
		}
		result = candidate.moveDescriptorFactory(pieceFromString(m[3]));
		if (!result) {
			throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_UCI_MOVE);
		}
	}
	else {
		if (m[3] !== '') { // Throw if a promotion piece is provided while no promotion happens.
			throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_UCI_MOVE);
		}
		result = candidate.moveDescriptor;
	}

	// Check that the KxR substitution is valid if it has been applied.
	if (kxRSubstitutionApplied && (!result.isCastling() || expectedRookFrom !== result._optionalSquare1)) {
		throw new InvalidNotation(getFEN(position), notation, i18n.ILLEGAL_UCI_MOVE);
	}

	return result;
}
