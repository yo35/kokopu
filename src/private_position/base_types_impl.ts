/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2024  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    Kokopu is free software: you can redistribute it and/or                 *
 *    modify it under the terms of the GNU Lesser General Public License      *
 *    as published by the Free Software Foundation, either version 3 of       *
 *    the License, or (at your option) any later version.                     *
 *                                                                            *
 *    Kokopu is distributed in the hope that it will be useful,               *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the            *
 *    GNU Lesser General Public License for more details.                     *
 *                                                                            *
 *    You should have received a copy of the GNU Lesser General               *
 *    Public License along with this program. If not, see                     *
 *    <http://www.gnu.org/licenses/>.                                         *
 *                                                                            *
 * -------------------------------------------------------------------------- */


import { Color, Piece, ColoredPiece, File, Rank, Square, GameResult, GameVariant } from '../base_types';


export const enum ColorImpl {
	WHITE = 0,
	BLACK = 1,
}


export const enum PieceImpl {
	KING   = 0,
	QUEEN  = 1,
	ROOK   = 2,
	BISHOP = 3,
	KNIGHT = 4,
	PAWN   = 5,
}


export const enum CpI {
	WK =  0, BK =  1,
	WQ =  2, BQ =  3,
	WR =  4, BR =  5,
	WB =  6, BB =  7,
	WN =  8, BN =  9,
	WP = 10, BP = 11,
}


/**
 * Special constants for chessboard square state.
 */
export const enum SpI {
	EMPTY   = -1,
	INVALID = -2, // Just for the internal board representation.
}


export const enum SquareImpl {
	A1 =   0, B1 =   1, C1 =   2, D1 =   3, E1 =   4, F1 =   5, G1 =   6, H1 =   7,
	A2 =  16, B2 =  17, C2 =  18, D2 =  19, E2 =  20, F2 =  21, G2 =  22, H2 =  23,
	A3 =  32, B3 =  33, C3 =  34, D3 =  35, E3 =  36, F3 =  37, G3 =  38, H3 =  39,
	A4 =  48, B4 =  49, C4 =  50, D4 =  51, E4 =  52, F4 =  53, G4 =  54, H4 =  55,
	A5 =  64, B5 =  65, C5 =  66, D5 =  67, E5 =  68, F5 =  69, G5 =  70, H5 =  71,
	A6 =  80, B6 =  81, C6 =  82, D6 =  83, E6 =  84, F6 =  85, G6 =  86, H6 =  87,
	A7 =  96, B7 =  97, C7 =  98, D7 =  99, E7 = 100, F7 = 101, G7 = 102, H7 = 103,
	A8 = 112, B8 = 113, C8 = 114, D8 = 115, E8 = 116, F8 = 117, G8 = 118, H8 = 119,
}


export const enum GameResultImpl {
	WHITE_WINS = 0,
	BLACK_WINS = 1,
	DRAW = 2,
	LINE = 3,
}


export const enum GameVariantImpl {
	REGULAR_CHESS = 0,
	CHESS960 = 1,
	NO_KING = 2,
	WHITE_KING_ONLY = 3,
	BLACK_KING_ONLY = 4,
	ANTICHESS = 5,
	HORDE = 6,
}


const COLOR_SYMBOL    = [ ...'wb' ];
const PIECE_SYMBOL    = [ ...'kqrbnp' ];
const FILE_SYMBOL     = [ ...'abcdefgh' ];
const RANK_SYMBOL     = [ ...'12345678' ];
const RESULT_SYMBOL   = [ '1-0', '0-1', '1/2-1/2', '*' ];
const VARIANT_SYMBOL  = [ 'regular', 'chess960', 'no-king', 'white-king-only', 'black-king-only', 'antichess', 'horde' ];
const FIGURINE_SYMBOL = [ ...'\u2654\u265a\u2655\u265b\u2656\u265c\u2657\u265d\u2658\u265e\u2659\u265f' ];


export function colorToString  (color   : number) { return COLOR_SYMBOL  [color  ] as Color      ; }
export function pieceToString  (piece   : number) { return PIECE_SYMBOL  [piece  ] as Piece      ; }
export function fileToString   (file    : number) { return FILE_SYMBOL   [file   ] as File       ; }
export function rankToString   (rank    : number) { return RANK_SYMBOL   [rank   ] as Rank       ; }
export function resultToString (result  : number) { return RESULT_SYMBOL [result ] as GameResult ; }
export function variantToString(variant : number) { return VARIANT_SYMBOL[variant] as GameVariant; }


export function colorFromString  (color   : unknown) { return typeof color   === 'string' ? COLOR_SYMBOL  .indexOf(color  ) : -1; }
export function pieceFromString  (piece   : unknown) { return typeof piece   === 'string' ? PIECE_SYMBOL  .indexOf(piece  ) : -1; }
export function fileFromString   (file    : unknown) { return typeof file    === 'string' ? FILE_SYMBOL   .indexOf(file   ) : -1; }
export function rankFromString   (rank    : unknown) { return typeof rank    === 'string' ? RANK_SYMBOL   .indexOf(rank   ) : -1; }
export function resultFromString (result  : unknown) { return typeof result  === 'string' ? RESULT_SYMBOL .indexOf(result ) : -1; }
export function variantFromString(variant : unknown) { return typeof variant === 'string' ? VARIANT_SYMBOL.indexOf(variant) : -1; }


export function squareToString(square: number) {
	return FILE_SYMBOL[square % 16] + RANK_SYMBOL[Math.trunc(square / 16)] as Square;
}


export function squareFromString(square: unknown) {
	if (typeof square !== 'string' || !/^[a-h][1-8]$/.test(square)) {
		return -1;
	}
	const file = FILE_SYMBOL.indexOf(square[0]);
	const rank = RANK_SYMBOL.indexOf(square[1]);
	return rank * 16 + file;
}


export function coloredPieceToString(cp: number) {
	return COLOR_SYMBOL[cp % 2] + PIECE_SYMBOL[Math.trunc(cp / 2)] as ColoredPiece;
}


export function coloredPieceFromString(cp: unknown) {
	if (typeof cp !== 'string' || !/^[wb][kqrbnp]$/.test(cp)) {
		return -1;
	}
	const color = COLOR_SYMBOL.indexOf(cp[0]);
	const piece = PIECE_SYMBOL.indexOf(cp[1]);
	return piece * 2 + color;
}


export function figurineToString(cp: number) {
	return FIGURINE_SYMBOL[cp];
}


export function figurineFromString(cp: unknown) {
	return FIGURINE_SYMBOL.indexOf(String(cp));
}


export function squareColorImpl(square: number) {
	return (~square ^ (square >> 4)) & 0x1;
}
