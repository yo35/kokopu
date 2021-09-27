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
