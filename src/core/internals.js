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


// Colors
exports.WHITE = 0;
exports.BLACK = 1;

// Pieces
exports.KING   = 0;
exports.QUEEN  = 1;
exports.ROOK   = 2;
exports.BISHOP = 3;
exports.KNIGHT = 4;
exports.PAWN   = 5;

// Special square values
exports.EMPTY = -1;
exports.INVALID = -2;


// -----------------------------------------------------------------------------
// Conversion API constants (strings) <-> internal constants (integers)
// -----------------------------------------------------------------------------

var COLOR_SYMBOL = 'wb'      ;
var PIECE_SYMBOL = 'kqrbnp'  ;
var RANK_SYMBOL  = '12345678';
var FILE_SYMBOL  = 'abcdefgh';

exports.colorToString = function(color) { return COLOR_SYMBOL[color]; }
exports.pieceToString = function(piece) { return PIECE_SYMBOL[piece]; }
exports.rankToString  = function(rank ) { return RANK_SYMBOL [rank ]; }
exports.fileToString  = function(file ) { return FILE_SYMBOL [file ]; }

exports.colorFromString = function(color) { return COLOR_SYMBOL.indexOf(color); }
exports.pieceFromString = function(piece) { return PIECE_SYMBOL.indexOf(piece); }
exports.rankFromString  = function(rank ) { return RANK_SYMBOL .indexOf(rank ); }
exports.fileFromString  = function(file ) { return FILE_SYMBOL .indexOf(file ); }

exports.squareToString = function(square) {
	return FILE_SYMBOL[square % 16] + RANK_SYMBOL[Math.floor(square / 16)];
}

exports.squareFromString = function(square) {
	if(!/^[a-h][1-8]$/.test(square)) {
		return -1;
	}
	var file = FILE_SYMBOL.indexOf(square[0]);
	var rank = RANK_SYMBOL.indexOf(square[1]);
	return rank*16 + file;
}

exports.coloredPieceToString = function(cp) {
	return COLOR_SYMBOL[cp % 2] + PIECE_SYMBOL[Math.floor(cp / 2)];
}

exports.coloredPieceFromString = function(cp) {
	if(!/^[wb][kqrbnp]$/.test(cp)) {
		return -1;
	}
	var color = COLOR_SYMBOL.indexOf(cp[0]);
	var piece = PIECE_SYMBOL.indexOf(cp[1]);
	return piece*2 + color;
}
