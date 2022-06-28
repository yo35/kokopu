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


import { Color, Piece, ColoredPiece, Square, GameResult, GameVariant } from '../base_types';


// TODO change into const enum
export const WHITE = 0;
export const BLACK = 1;


// TODO change into const enum
export const KING   = 0;
export const QUEEN  = 1;
export const ROOK   = 2;
export const BISHOP = 3;
export const KNIGHT = 4;
export const PAWN   = 5;


// TODO change into const enum
export const WK =  0; export const BK =  1;
export const WQ =  2; export const BQ =  3;
export const WR =  4; export const BR =  5;
export const WB =  6; export const BB =  7;
export const WN =  8; export const BN =  9;
export const WP = 10; export const BP = 11;


/**
 * Special constants for chessboard square state. TODO change into const enum
 */
export const EMPTY   = -1;
export const INVALID = -2; // Just for the internal board representation.


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


// TODO change into const enum
export const WHITE_WINS = 0;
export const BLACK_WINS = 1;
export const DRAW = 2;
export const LINE = 3;


// TODO change into const enum
export const REGULAR_CHESS = 0;
export const CHESS960 = 1;
export const NO_KING = 2;
export const WHITE_KING_ONLY = 3;
export const BLACK_KING_ONLY = 4;
export const ANTICHESS = 5;
export const HORDE = 6;


const COLOR_SYMBOL    = 'wb';
const PIECE_SYMBOL    = 'kqrbnp';
const FIGURINE_SYMBOL = '\u2654\u265a\u2655\u265b\u2656\u265c\u2657\u265d\u2658\u265e\u2659\u265f';
const RANK_SYMBOL     = '12345678';
const FILE_SYMBOL     = 'abcdefgh';
const RESULT_SYMBOL   = [ '1-0', '0-1', '1/2-1/2', '*' ];
const VARIANT_SYMBOL  = [ 'regular', 'chess960', 'no-king', 'white-king-only', 'black-king-only', 'antichess', 'horde' ];


export function colorToString   (color   : number) { return COLOR_SYMBOL   [color  ] as Color; }
export function pieceToString   (piece   : number) { return PIECE_SYMBOL   [piece  ] as Piece; }
export function figurineToString(cp      : number) { return FIGURINE_SYMBOL[cp     ]; }
export function rankToString    (rank    : number) { return RANK_SYMBOL    [rank   ]; }
export function fileToString    (file    : number) { return FILE_SYMBOL    [file   ]; }
export function resultToString  (result  : number) { return RESULT_SYMBOL  [result ] as GameResult; }
export function variantToString (variant : number) { return VARIANT_SYMBOL [variant] as GameVariant; }


export function colorFromString   (color   : string) { return color   === '' ? -1 : COLOR_SYMBOL   .indexOf(color  ); } // TODO improve input check
export function pieceFromString   (piece   : string) { return piece   === '' ? -1 : PIECE_SYMBOL   .indexOf(piece  ); }
export function figurineFromString(cp      : string) { return cp      === '' ? -1 : FIGURINE_SYMBOL.indexOf(cp     ); }
export function rankFromString    (rank    : string) { return rank    === '' ? -1 : RANK_SYMBOL    .indexOf(rank   ); }
export function fileFromString    (file    : string) { return file    === '' ? -1 : FILE_SYMBOL    .indexOf(file   ); }
export function resultFromString  (result  : string) { return RESULT_SYMBOL .indexOf(result ); }
export function variantFromString (variant : string) { return VARIANT_SYMBOL.indexOf(variant); }


export function squareToString(square: number) {
	return FILE_SYMBOL[square % 16] + RANK_SYMBOL[Math.trunc(square / 16)] as Square;
}


export function squareFromString(square: string) {
	if (!/^[a-h][1-8]$/.test(square)) {
		return -1;
	}
	const file = FILE_SYMBOL.indexOf(square[0]);
	const rank = RANK_SYMBOL.indexOf(square[1]);
	return rank * 16 + file;
}


export function coloredPieceToString(cp: number) {
	return COLOR_SYMBOL[cp % 2] + PIECE_SYMBOL[Math.trunc(cp / 2)] as ColoredPiece;
}


export function coloredPieceFromString(cp: string) {
	if (!/^[wb][kqrbnp]$/.test(cp)) {
		return -1;
	}
	const color = COLOR_SYMBOL.indexOf(cp[0]);
	const piece = PIECE_SYMBOL.indexOf(cp[1]);
	return piece * 2 + color;
}
