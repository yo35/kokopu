/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2023  Yoann Le Montagner <yo35 -at- melix.net>       *
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


import { Color, Square, Coordinates, GameVariant } from './base_types';
import { IllegalArgument } from './exception';

import { colorFromString, colorToString, squareFromString, squareToString, fileToString, rankToString, variantFromString, squareColorImpl } from './private_position/base_types_impl';
import { hasCanonicalStartPosition } from './private_position/impl';
import { isValidNag } from './private_game/common';


/**
 * Execute the given callback on each of the 64 squares.
 */
export function forEachSquare(callback: (square: Square) => void): void {
	for (let rank = 0; rank < 8; ++rank) {
		for (let file = 0; file < 8; ++file) {
			callback(squareToString(rank * 16 + file));
		}
	}
}


/**
 * Return the color of a square.
 */
export function squareColor(square: Square): Color {
	const squareCode = squareFromString(square);
	if (squareCode < 0) {
		throw new IllegalArgument('squareColor()');
	}
	return colorToString(squareColorImpl(squareCode));
}


/**
 * Return the coordinates of a square.
 */
export function squareToCoordinates(square: Square): Coordinates {
	const squareCode = squareFromString(square);
	if (squareCode < 0) {
		throw new IllegalArgument('squareToCoordinates()');
	}
	return { rank: Math.trunc(squareCode / 16), file: squareCode % 16 };
}


/**
 * Return the square corresponding to the given coordinates.
 */
export function coordinatesToSquare(file: number, rank: number): Square;

/**
 * Return the square corresponding to the given coordinates.
 */
export function coordinatesToSquare(coordinates: Coordinates): Square;

export function coordinatesToSquare(fileOrCoordinates: number | Coordinates, rankOrUndefined?: number): Square {
	const file = typeof fileOrCoordinates === 'number' ? fileOrCoordinates : fileOrCoordinates.file;
	const rank = typeof fileOrCoordinates === 'number' ? rankOrUndefined! : fileOrCoordinates.rank;
	if (!Number.isInteger(file) || !Number.isInteger(rank) || file < 0 || file >= 8 || rank < 0 || rank >= 8) {
		throw new IllegalArgument('coordinatesToSquare()');
	}
	return fileToString(file) + rankToString(rank) as Square;
}


/**
 * Change white to black, and black to white.
 */
export function oppositeColor(color: Color): Color {
	const colorCode = colorFromString(color);
	if (colorCode < 0) {
		throw new IllegalArgument('oppositeColor()');
	}
	return colorToString(1 - colorCode);
}


/**
 * Whether the given variant has a canonical start position or not.
 */
export function variantWithCanonicalStartPosition(variant: GameVariant): boolean {
	const variantCode = variantFromString(variant);
	if (variantCode < 0) {
		throw new IllegalArgument('variantWithCanonicalStartPosition()');
	}
	return hasCanonicalStartPosition(variantCode);
}


const NAG_SYMBOLS = new Map<number, string>();

NAG_SYMBOLS.set(  1, '!',     ); // good move
NAG_SYMBOLS.set(  2, '?',     ); // bad move
NAG_SYMBOLS.set(  3, '!!',    ); // very good move
NAG_SYMBOLS.set(  4, '??',    ); // very bad move
NAG_SYMBOLS.set(  5, '!?',    ); // interesting move
NAG_SYMBOLS.set(  6, '?!',    ); // questionable move
NAG_SYMBOLS.set(  7, '\u25a1' ); // Only move
NAG_SYMBOLS.set(  8, '\u25a1' ); // Only move (ChessBase)
NAG_SYMBOLS.set( 10, '=',     ); // equal position
NAG_SYMBOLS.set( 11, '=',     ); // equal position (ChessBase)
NAG_SYMBOLS.set( 13, '\u221e' ); // unclear position
NAG_SYMBOLS.set( 14, '\u2a72' ); // White has a slight advantage
NAG_SYMBOLS.set( 15, '\u2a71' ); // Black has a slight advantage
NAG_SYMBOLS.set( 16, '\u00b1' ); // White has a moderate advantage
NAG_SYMBOLS.set( 17, '\u2213' ); // Black has a moderate advantage
NAG_SYMBOLS.set( 18, '+\u2212'); // White has a decisive advantage
NAG_SYMBOLS.set( 19, '\u2212+'); // Black has a decisive advantage
NAG_SYMBOLS.set( 22, '\u2a00' ); // Zugzwang
NAG_SYMBOLS.set( 32, '\u27f3' ); // Development advantage
NAG_SYMBOLS.set( 36, '\u2191' ); // Initiative
NAG_SYMBOLS.set( 40, '\u2192' ); // Attack
NAG_SYMBOLS.set(132, '\u21c6' ); // Counterplay
NAG_SYMBOLS.set(138, '\u2a01' ); // Zeitnot
NAG_SYMBOLS.set(140, '\u2206' ); // With idea...
NAG_SYMBOLS.set(141, '\u2207' ); // Aimed against...
NAG_SYMBOLS.set(142, '\u2313' ); // Better is...
NAG_SYMBOLS.set(143, '\u2264' ); // Worse is...
NAG_SYMBOLS.set(145, 'RR',    ); // Editorial comment
NAG_SYMBOLS.set(146, 'N',     ); // Novelty


/**
 * Return the human-readable symbol for the given [NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs).
 */
export function nagSymbol(nag: number): string {
	if (!isValidNag(nag)) {
		throw new IllegalArgument('nagSymbol()');
	}
	const result = NAG_SYMBOLS.get(nag);
	return result === undefined ? '$' + nag : result;
}


/**
 * Whether the given string represents a valid [ECO code](https://en.wikipedia.org/wiki/List_of_chess_openings) or not.
 */
export function isValidECO(eco: string): boolean {
	return /^[A-E][0-9][0-9]$/.test(eco);
}
