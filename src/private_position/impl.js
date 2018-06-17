/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018  Yoann Le Montagner <yo35 -at- melix.net>            *
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


var bt = require('../basetypes');
var EMPTY = bt.EMPTY;
var INVALID = bt.INVALID;


exports.makeEmpty = function(variant) {
	return {

		// Board state
		board: [
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
		],

		// Flags
		turn: bt.WHITE,
		castling: [0, 0],
		enPassant: -1,
		variant: variant,

		// Computed attributes
		legal: false,
		king: [-1, -1]
	};
};


exports.makeInitial = function() {
	return {

		// Board state
		board: [
			bt.WR, bt.WN, bt.WB, bt.WQ, bt.WK, bt.WB, bt.WN, bt.WR, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			bt.BR, bt.BN, bt.BB, bt.BQ, bt.BK, bt.BB, bt.BN, bt.BR
		],

		// Flags
		turn: bt.WHITE,
		castling: [129 /* (1 << A-file) | (1 << H-file) */, 129],
		enPassant: -1,
		variant: bt.REGULAR_CHESS,

		// Computed attributes
		legal: true,
		king: [4 /* e1 */, 116 /* e8 */]
	};
};


/**
 * Chess 960 initial position, following the numbering scheme proposed by Reinhard Scharnagl (see for instance
 * https://chessprogramming.wikispaces.com/Reinhard+Scharnagl and https://chess960.net/start-positions/).
 */
exports.make960FromScharnagl = function(scharnaglCode) {
	var info = decodeScharnagl(scharnaglCode);
	var r1 = info.map(function(piece) { return piece*2 + bt.WHITE; });
	var r8 = info.map(function(piece) { return piece*2 + bt.BLACK; });
	return {

		// Board state
		board: [
			r1[0], r1[1], r1[2], r1[3], r1[4], r1[5], r1[6], r1[7], INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			r8[0], r8[1], r8[2], r8[3], r8[4], r8[5], r8[6], r8[7]
		],

		// Flags
		turn: bt.WHITE,
		castling: [info.castling, info.castling],
		enPassant: -1,
		variant: bt.CHESS_960,

		// Computed attributes
		legal: true,
		king: [info.kingFile, 112 + info.kingFile]
	};
};


function decodeScharnagl(scharnaglCode) {
	var scheme = [-1, -1, -1, -1, -1, -1, -1, -1];
	var castling = 0;
	var kingFile = -1;

	// TODO impl decode

	return {
		scheme: scheme,
		castling: castling,
		kingFile: kingFile
	};
}


exports.makeCopy = function(position) {
	return {
		board    : position.board.slice(),
		turn     : position.turn,
		castling : position.castling.slice(),
		enPassant: position.enPassant,
		variant  : position.variant,
		legal    : position.legal,
		king     : position.king.slice()
	};
};
