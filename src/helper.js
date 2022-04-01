/******************************************************************************
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
 ******************************************************************************/


'use strict';


var bt = require('./basetypes');
var exception = require('./exception');
var impl = require('./private_position/impl');


/**
 * Execute the given callback on each of the 64 squares.
 *
 * @param {function(Square)} callback
 */
exports.forEachSquare = function(callback) {
	for(var rank=0; rank<8; ++rank) {
		for(var file=0; file<8; ++file) {
			callback(bt.squareToString(rank * 16 + file));
		}
	}
};


/**
 * Return the color of a square.
 *
 * @param {Square} square
 * @returns {Color}
 */
exports.squareColor = function(square) {
	square = bt.squareFromString(square);
	if(square < 0) {
		throw new exception.IllegalArgument('squareColor()');
	}
	return Math.floor(square/16) % 2 === square % 2 ? 'b' : 'w';
};


/**
 * Return the coordinates of a square.
 *
 * @param {Square} square
 * @returns {{rank: number, file: number}} The `rank` and `file` fields have the same meaning as in {@link coordinatesToSquare}.
 */
exports.squareToCoordinates = function(square) {
	square = bt.squareFromString(square);
	if(square < 0) {
		throw new exception.IllegalArgument('squareToCoordinates()');
	}
	return { rank:Math.floor(square/16), file:square%16 };
};


/**
 * Return the square corresponding to the given coordinates.
 *
 * @param {number} file `0` for file A, `1` for file B, ..., `7` for file H.
 * @param {number} rank `0` for the first rank, ..., `7` for the eighth rank.
 * @returns {Square}
 * @throws {exception.IllegalArgument} If either `file` or `rank` is not between 0 and 7 (inclusive).
 */
exports.coordinatesToSquare = function(file, rank) {
	if(file<0 || file>=8 || rank<0 || rank>= 8) {
		throw new exception.IllegalArgument('coordinatesToSquare()');
	}
	return bt.fileToString(file) + bt.rankToString(rank);
};


/**
 * Change white to black, and black to white.
 *
 * @param {Color} color
 * @returns {Color}
 */
exports.oppositeColor = function(color) {
	color = bt.colorFromString(color);
	if (color < 0) {
		throw new exception.IllegalArgument('oppositeColor()');
	}
	return bt.colorToString(1 - color);
};


/**
 * Whether the given variant has a canonical start position or not.
 *
 * @param {GameVariant} variant
 * @returns {boolean}
 */
exports.variantWithCanonicalStartPosition = function(variant) {
	variant = bt.variantFromString(variant);
	if (variant < 0) {
		throw new exception.IllegalArgument('oppositeColor()');
	}
	return impl.variantWithCanonicalStartPosition(variant);
};


var NAG_SYMBOLS = {
	/* eslint-disable no-mixed-spaces-and-tabs */
	  3: '!!',      // very good move
	  1: '!',       // good move
	  5: '!?',      // interesting move
	  6: '?!',      // questionable move
	  2: '?',       // bad move
	  4: '??',      // very bad move
	 18: '+\u2212', // White has a decisive advantage
	 16: '\u00b1',  // White has a moderate advantage
	 14: '\u2a72',  // White has a slight advantage
	 10: '=',       // equal position
	 11: '=',       // equal position (ChessBase)
	 13: '\u221e',  // unclear position
	 15: '\u2a71',  // Black has a slight advantage
	 17: '\u2213',  // Black has a moderate advantage
	 19: '\u2212+', // Black has a decisive advantage
	  7: '\u25a1',  // Only move
	  8: '\u25a1',  // Only move (ChessBase)
	 22: '\u2a00',  // Zugzwang
	 32: '\u27f3',  // Development advantage
	 36: '\u2191',  // Initiative
	 40: '\u2192',  // Attack
	132: '\u21c6',  // Counterplay
	138: '\u2a01',  // Zeitnot
	140: '\u2206',  // With idea
	142: '\u2313',  // Better is
	146: 'N',       // Novelty
	/* eslint-enable no-mixed-spaces-and-tabs */
};


/**
 * Return the human-readable symbol for the given [NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs).
 *
 * @param {number} nag
 * @returns {string}
 */
exports.nagSymbol = function(nag) {
	return nag in NAG_SYMBOLS ? NAG_SYMBOLS[nag] : '$' + nag;
};
