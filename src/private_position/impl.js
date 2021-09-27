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


var bt = require('../basetypes');
var EMPTY = bt.EMPTY;
var INVALID = bt.INVALID;

var EMPTY_BOARD = [
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
];

var REGULAR_START_BOARD = [
	bt.WR, bt.WN, bt.WB, bt.WQ, bt.WK, bt.WB, bt.WN, bt.WR, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.BR, bt.BN, bt.BB, bt.BQ, bt.BK, bt.BB, bt.BN, bt.BR
];

var HORDE_START_BOARD = [
	bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, bt.WP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, bt.WP, bt.WP, EMPTY, EMPTY, bt.WP, bt.WP, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, bt.BP, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	bt.BR, bt.BN, bt.BB, bt.BQ, bt.BK, bt.BB, bt.BN, bt.BR
];

var START_POSITION_INFO = [

	{ // Regular chess
		board: REGULAR_START_BOARD,
		castling: [129 /* (1 << A-file) | (1 << H-file) */, 129],
		king: [4 /* e1 */, 116 /* e8 */],
	},

	null, // Chess960
	null, // no king
	null, // white king only
	null, // black king only

	{ // Antichess
		board: REGULAR_START_BOARD,
		castling: [0, 0],
		king: [-1, -1],
	},

	{ // Horde
		board: HORDE_START_BOARD,
		castling: [0, 129 /* (1 << A-file) | (1 << H-file) */],
		king: [-1, 116 /* e8 */],
	},
];

exports.variantWithCanonicalStartPosition = function(variant) {
	return START_POSITION_INFO[variant] !== null;
};


exports.makeEmpty = function(variant) {
	return {

		// Board state
		board: EMPTY_BOARD.slice(),

		// Flags
		turn: bt.WHITE,
		castling: [0, 0],
		enPassant: -1,
		variant: variant,

		// Computed attributes
		legal: variant === bt.NO_KING,
		king: [-1, -1]
	};
};


exports.makeInitial = function(variant) {
	var info = START_POSITION_INFO[variant];
	return {

		// Board state
		board: info.board.slice(),

		// Flags
		turn: bt.WHITE,
		castling: info.castling.slice(),
		enPassant: -1,
		variant: variant,

		// Computed attributes
		legal: true,
		king: info.king.slice(),
	};
};


/**
 * Chess960 initial position, following the numbering scheme proposed by Reinhard Scharnagl (see for instance https://chess960.net/start-positions/).
 */
exports.make960FromScharnagl = function(scharnaglCode) {
	var info = decodeScharnagl(scharnaglCode);
	var r1 = info.scheme.map(function(piece) { return piece*2 + bt.WHITE; });
	var r8 = info.scheme.map(function(piece) { return piece*2 + bt.BLACK; });
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
		variant: bt.CHESS960,

		// Computed attributes
		legal: true,
		king: [info.kingFile, 112 + info.kingFile]
	};
};


function decodeScharnagl(scharnaglCode) {
	var scheme = [-1, -1, -1, -1, -1, -1, -1, -1];
	var castling = 0;
	var kingFile = -1;

	function forEachEmpty(fun) {
		var emptyIndex = 0;
		for(var file = 0; file < 8; ++file) {
			if(scheme[file] >= 0) { continue; }

			fun(file, emptyIndex);
			++emptyIndex;
		}
	}

	function setAt(piece, target1, target2) {
		forEachEmpty(function(file, emptyIndex) {
			if(emptyIndex === target1 || emptyIndex === target2) {
				scheme[file] = piece;
			}
		});
	}

	// Light-square bishop
	scheme[(scharnaglCode % 4) * 2 + 1] = bt.BISHOP;
	scharnaglCode = Math.floor(scharnaglCode / 4);

	// Dark-square bishop
	scheme[(scharnaglCode % 4) * 2] = bt.BISHOP;
	scharnaglCode = Math.floor(scharnaglCode / 4);

	// Queen
	setAt(bt.QUEEN, scharnaglCode % 6, -1);
	scharnaglCode = Math.floor(scharnaglCode / 6);

	// Knights
	switch(scharnaglCode) {
		case 0: setAt(bt.KNIGHT, 0, 1); break;
		case 1: setAt(bt.KNIGHT, 0, 2); break;
		case 2: setAt(bt.KNIGHT, 0, 3); break;
		case 3: setAt(bt.KNIGHT, 0, 4); break;
		case 4: setAt(bt.KNIGHT, 1, 2); break;
		case 5: setAt(bt.KNIGHT, 1, 3); break;
		case 6: setAt(bt.KNIGHT, 1, 4); break;
		case 7: setAt(bt.KNIGHT, 2, 3); break;
		case 8: setAt(bt.KNIGHT, 2, 4); break;
		case 9: setAt(bt.KNIGHT, 3, 4); break;
		default: break;
	}

	// Rooks and king
	forEachEmpty(function(file, emptyIndex) {
		if(emptyIndex === 1) {
			scheme[file] = bt.KING;
			kingFile = file;
		}
		else {
			scheme[file] = bt.ROOK;
			castling |= 1 << file;
		}
	});

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
