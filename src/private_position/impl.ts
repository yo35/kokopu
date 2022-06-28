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


import { WHITE, BLACK, KING, QUEEN, ROOK, BISHOP, KNIGHT, WK, WQ, WR, WB, WN, WP, BK, BQ, BR, BB, BN, BP, EMPTY, INVALID, SquareImpl, CHESS960, NO_KING } from './base_types_impl';


const EMPTY_BOARD = [
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
];

const REGULAR_START_BOARD = [
	WR   , WN   , WB   , WQ   , WK   , WB   , WN   , WR   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	WP   , WP   , WP   , WP   , WP   , WP   , WP   , WP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	BP   , BP   , BP   , BP   , BP   , BP   , BP   , BP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	BR   , BN   , BB   , BQ   , BK   , BB   , BN   , BR   ,
];

const HORDE_START_BOARD = [
	WP   , WP   , WP   , WP   , WP   , WP   , WP   , WP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	WP   , WP   , WP   , WP   , WP   , WP   , WP   , WP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	WP   , WP   , WP   , WP   , WP   , WP   , WP   , WP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	WP   , WP   , WP   , WP   , WP   , WP   , WP   , WP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, WP   , WP   , EMPTY, EMPTY, WP   , WP   , EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	BP   , BP   , BP   , BP   , BP   , BP   , BP   , BP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
	BR   , BN   , BB   , BQ   , BK   , BB   , BN   , BR   ,
];


/**
 * Internal structure in `Position`, that encodes the state of the corresponding chess position.
 */
export interface PositionImpl {

	// Board state
	board: number[],

	// Flags
	turn: number,
	castling: number[],
	enPassant: number,
	variant: number,

	// Computed attributes
	legal: boolean | null,
	king: number[],
}


interface StartPositionInfo {
	board: number[],
	castling: number[],
	king: number[],
}


interface ScharnaglInfo {
	pieceScheme: number[],
	castling: number,
	kingFile: number,
}


const START_POSITION_INFO: (StartPositionInfo | null)[] = [

	{ // Regular chess
		board: REGULAR_START_BOARD,
		castling: [ 129 /* (1 << A-file) | (1 << H-file) */, 129 /* (1 << A-file) | (1 << H-file) */ ],
		king: [ SquareImpl.E1, SquareImpl.E8 ],
	},

	null, // Chess960
	null, // no king
	null, // white king only
	null, // black king only

	{ // Antichess
		board: REGULAR_START_BOARD,
		castling: [ 0, 0 ],
		king: [ -1, -1 ],
	},

	{ // Horde
		board: HORDE_START_BOARD,
		castling: [ 0, 129 /* (1 << A-file) | (1 << H-file) */ ],
		king: [ -1, SquareImpl.E8 ],
	},
];


export function variantWithCanonicalStartPosition(variant: number) { // TODO rename
	return START_POSITION_INFO[variant] !== null;
}


export function makeEmpty(variant: number): PositionImpl {
	return {
		board: EMPTY_BOARD.slice(),
		turn: WHITE,
		castling: [ 0, 0 ],
		enPassant: -1,
		variant: variant,
		legal: variant === NO_KING,
		king: [ -1, -1 ],
	};
}


/**
 * @param variant Must be a variant with a canonical start position.
 */
export function makeInitial(variant: number): PositionImpl {
	const info = START_POSITION_INFO[variant]!; // WARNING: applicable only to variants with a canonical start position.
	return {
		board: info.board.slice(),
		turn: WHITE,
		castling: info.castling.slice(),
		enPassant: -1,
		variant: variant,
		legal: true,
		king: info.king.slice(),
	};
}


/**
 * Chess960 initial position, following the numbering scheme proposed by Reinhard Scharnagl (see for instance https://chess960.net/start-positions/).
 *
 * @param scharnaglCode Integer between 0 and 959 inclusive.
 */
export function make960FromScharnagl(scharnaglCode: number): PositionImpl {
	const info = decodeScharnagl(scharnaglCode);
	const rank1 = info.pieceScheme.map(piece => piece * 2 + WHITE);
	const rank8 = info.pieceScheme.map(piece => piece * 2 + BLACK);
	return {
		board: [
			rank1[0] , rank1[1] , rank1[2] , rank1[3] , rank1[4] , rank1[5] , rank1[6] , rank1[7] , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			WP   , WP   , WP   , WP   , WP   , WP   , WP   , WP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			BP   , BP   , BP   , BP   , BP   , BP   , BP   , BP   , INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
			rank8[0] , rank8[1] , rank8[2] , rank8[3] , rank8[4] , rank8[5] , rank8[6] , rank8[7] ,
		],
		turn: WHITE,
		castling: [ info.castling, info.castling ],
		enPassant: -1,
		variant: CHESS960,
		legal: true,
		king: [ SquareImpl.A1 + info.kingFile, SquareImpl.A8 + info.kingFile ],
	};
}


/**
 * @param scharnaglCode Integer between 0 and 959 inclusive.
 */
function decodeScharnagl(scharnaglCode: number): ScharnaglInfo {
	const scheme = [ -1, -1, -1, -1, -1, -1, -1, -1 ];
	let castling = 0;
	let kingFile = -1;

	function forEachEmpty(fun: (file: number, emptyIndex: number) => void) {
		let emptyIndex = 0;
		for (let file = 0; file < 8; ++file) {
			if (scheme[file] >= 0) {
				continue;
			}
			fun(file, emptyIndex);
			++emptyIndex;
		}
	}

	function setAt(piece: number, emptyIndexTarget1: number, emptyIndexTarget2: number) {
		forEachEmpty((file, emptyIndex) => {
			if (emptyIndex === emptyIndexTarget1 || emptyIndex === emptyIndexTarget2) {
				scheme[file] = piece;
			}
		});
	}

	// Light-square bishop
	scheme[(scharnaglCode % 4) * 2 + 1] = BISHOP;
	scharnaglCode = Math.trunc(scharnaglCode / 4);

	// Dark-square bishop
	scheme[(scharnaglCode % 4) * 2] = BISHOP;
	scharnaglCode = Math.trunc(scharnaglCode / 4);

	// Queen
	setAt(QUEEN, scharnaglCode % 6, -1);
	scharnaglCode = Math.trunc(scharnaglCode / 6);

	// Knights
	switch (scharnaglCode) {
		case 0: setAt(KNIGHT, 0, 1); break;
		case 1: setAt(KNIGHT, 0, 2); break;
		case 2: setAt(KNIGHT, 0, 3); break;
		case 3: setAt(KNIGHT, 0, 4); break;
		case 4: setAt(KNIGHT, 1, 2); break;
		case 5: setAt(KNIGHT, 1, 3); break;
		case 6: setAt(KNIGHT, 1, 4); break;
		case 7: setAt(KNIGHT, 2, 3); break;
		case 8: setAt(KNIGHT, 2, 4); break;
		case 9: setAt(KNIGHT, 3, 4); break;
		default: break;
	}

	// Rooks and king
	forEachEmpty((file, emptyIndex) => {
		if (emptyIndex === 1) {
			scheme[file] = KING;
			kingFile = file;
		}
		else {
			scheme[file] = ROOK;
			castling |= 1 << file;
		}
	});

	return {
		pieceScheme: scheme,
		castling: castling,
		kingFile: kingFile
	};
}


export function makeCopy(position: PositionImpl): PositionImpl {
	return {
		board    : position.board.slice(),
		turn     : position.turn,
		castling : position.castling.slice(),
		enPassant: position.enPassant,
		variant  : position.variant,
		legal    : position.legal,
		king     : position.king.slice(),
	};
}


export function isEqual(pos1: PositionImpl, pos2: PositionImpl) {
	if (pos1.turn !== pos2.turn || pos1.variant !== pos2.variant) {
		return false;
	}
	for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
		if (pos1.board[sq] !== pos2.board[sq]) {
			return false;
		}
	}
	// No check on `.legal` and `.king` as they are computed attributes.
	return pos1.castling[0] === pos2.castling[0] && pos1.castling[1] === pos2.castling[1] && pos1.enPassant === pos2.enPassant;
}
