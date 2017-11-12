/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chess, a JavaScript chess library.             *
 *    Copyright (C) 2017  Yoann Le Montagner <yo35 -at- melix.net>            *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


'use strict';


var bt = require('./basetypes');
var exception = require('./exception');


/**
 * Iterate on each of the 64 squares.
 * 
 * @param {function} fun
 */
exports.forEachSquare = function(fun) {
	for(var rank=0; rank<8; ++rank) {
		for(var file=0; file<8; ++file) {
			fun(bt.squareToString(rank * 16 + file));
		}
	}
};


/**
 * Return the color of a square.
 *
 * @param {string} square
 * @returns {string} Either `'w'` or `'b'`.
 */
exports.squareColor = function(square) {
	if(typeof square === 'string') {
		if     (/^[aceg][1357]$/.test(square) || /^[bdfh][2468]$/.test(square)) { return 'b'; }
		else if(/^[aceg][2468]$/.test(square) || /^[bdfh][1357]$/.test(square)) { return 'w'; }
	}
	throw new exception.IllegalArgument('squareColor()');
};


/**
 * Return the coordinates of a square.
 *
 * @param {string} square
 * @returns {{rank:number, file:number}} 
 */
exports.squareCoordinates = function(square) {
	square = bt.squareFromString(square);
	if(square < 0) {
		throw new exception.IllegalArgument('squareToCoordinates()');
	}
	return { rank:Math.floor(square/16), file:square%16 };
};


/**
 * Return the square corresponding to the given coordinates.
 *
 * @param {number} file
 * @param {number} rank
 * @returns {string} `'-'` is returned if the coordinates are invalid.
 */
exports.square = function(file, rank) {
	return file<0 || file>=8 || rank<0 || rank>= 8 ? '-' : bt.fileToString(file) + bt.rankToString(rank); 
};
