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

// Colored pieces
exports.WK =  0; exports.BK =  1;
exports.WQ =  2; exports.BQ =  3;
exports.WR =  4; exports.BR =  5;
exports.WB =  6; exports.BB =  7;
exports.WN =  8; exports.BN =  9;
exports.WP = 10; exports.BP = 11;

// Special square values
exports.EMPTY = -1;
exports.INVALID = -2;

// Game result
exports.WHITE_WINS = 0;
exports.BLACK_WINS = 1;
exports.DRAW = 2;
exports.LINE = 3;

// Game variant
exports.REGULAR_CHESS = 0;
exports.CHESS960 = 1;
exports.NO_KING = 2;
exports.WHITE_KING_ONLY = 3;
exports.BLACK_KING_ONLY = 4;
exports.ANTICHESS = 5;
exports.HORDE = 6;


// -----------------------------------------------------------------------------
// Conversion API constants (strings) <-> internal constants (integers)
// -----------------------------------------------------------------------------

var COLOR_SYMBOL    = 'wb';
var PIECE_SYMBOL    = 'kqrbnp';
var FIGURINE_SYMBOL = '\u2654\u265a\u2655\u265b\u2656\u265c\u2657\u265d\u2658\u265e\u2659\u265f';
var RANK_SYMBOL     = '12345678';
var FILE_SYMBOL     = 'abcdefgh';
var RESULT_SYMBOL   = ['1-0', '0-1', '1/2-1/2', '*'];
var VARIANT_SYMBOL  = ['regular', 'chess960', 'no-king', 'white-king-only', 'black-king-only', 'antichess', 'horde'];

exports.colorToString    = function(color  ) { return COLOR_SYMBOL   [color  ]; };
exports.pieceToString    = function(piece  ) { return PIECE_SYMBOL   [piece  ]; };
exports.figurineToString = function(cp     ) { return FIGURINE_SYMBOL[cp     ]; };
exports.rankToString     = function(rank   ) { return RANK_SYMBOL    [rank   ]; };
exports.fileToString     = function(file   ) { return FILE_SYMBOL    [file   ]; };
exports.resultToString   = function(result ) { return RESULT_SYMBOL  [result ]; };
exports.variantToString  = function(variant) { return VARIANT_SYMBOL [variant]; };

exports.colorFromString    = function(color  ) { return color   === '' ? -1 : COLOR_SYMBOL   .indexOf(color  ); };
exports.pieceFromString    = function(piece  ) { return piece   === '' ? -1 : PIECE_SYMBOL   .indexOf(piece  ); };
exports.figurineFromString = function(cp     ) { return cp      === '' ? -1 : FIGURINE_SYMBOL.indexOf(cp     ); };
exports.rankFromString     = function(rank   ) { return rank    === '' ? -1 : RANK_SYMBOL    .indexOf(rank   ); };
exports.fileFromString     = function(file   ) { return file    === '' ? -1 : FILE_SYMBOL    .indexOf(file   ); };
exports.resultFromString   = function(result ) { return RESULT_SYMBOL .indexOf(result ); };
exports.variantFromString  = function(variant) { return VARIANT_SYMBOL.indexOf(variant); };

exports.squareToString = function(square) {
	return FILE_SYMBOL[square % 16] + RANK_SYMBOL[Math.floor(square / 16)];
};

exports.squareFromString = function(square) {
	if(!/^[a-h][1-8]$/.test(square)) {
		return -1;
	}
	var file = FILE_SYMBOL.indexOf(square[0]);
	var rank = RANK_SYMBOL.indexOf(square[1]);
	return rank*16 + file;
};

exports.coloredPieceToString = function(cp) {
	return COLOR_SYMBOL[cp % 2] + PIECE_SYMBOL[Math.floor(cp / 2)];
};

exports.coloredPieceFromString = function(cp) {
	if(!/^[wb][kqrbnp]$/.test(cp)) {
		return -1;
	}
	var color = COLOR_SYMBOL.indexOf(cp[0]);
	var piece = PIECE_SYMBOL.indexOf(cp[1]);
	return piece*2 + color;
};


// -----------------------------------------------------------------------------
// Typedefs for documentation
// -----------------------------------------------------------------------------

/**
 * Either `'w'` (white) or `'b'` (black).
 * @typedef {string} Color
 */

/**
 * One-character string identifying a type of piece: `'p'` (pawn), `'n'`, `'b'`, `'r'`, `'q'` or `'k'`.
 * @typedef {string} Piece
 */

/**
 * Two-character string identifying a colored piece: `'wk'` (white king), `'br'` (black rook), etc...
 * @typedef {string} ColoredPiece
 */

/**
 * `'-'` Symbol used to identify an empty square.
 * @typedef {string} Empty
 */

/**
 * Either a one-character string among `'a'`, `'b'`, ..., `'h'` (indicating the file on which *en-passant* is allowed),
 * or `'-'` (indicating that *en-passant* is not allowed).
 * @typedef {string} EnPassantFlag
 */

/**
 * Two-character string identifying a castle: `'wq'` (white queen-side castle), `'wk'`, `'bq'` or `'bk'`.
 * @typedef {string} Castle
 */

/**
 * Two-character string identifying a castle with the Chess960 rules: `'wa'` (white castle with rook initially on the a-file),
 * `'wb'`, `'wc'`, ..., `'bh'`.
 * @typedef {string} Castle960
 */

/**
 * Two-character string identifying a square: `'a1'`, `'a2'`, ..., `'h8'`.
 * @typedef {string} Square
 */

/**
 * Result of a chess game. Must be one of the following constant:
 *  - `'1-0'` (white wins),
 *  - `'1/2-1/2'` (draw),
 *  - `'0-1'` (black wins),
 *  - `'*'` (unfinished game, or undefined result).
 *
 * @typedef {string} GameResult
 */

/**
 * Variant of chess. Must be one of the following constant:
 *  - `'regular'` (regular chess rules),
 *  - `'chess960'` ([Chess960](https://en.wikipedia.org/wiki/Chess960), also known as Fischer Random Chess).
 *  - `'no-king'` (chess position without any king)
 *  - `'white-king-only'` (chess position with no black king)
 *  - `'black-king-only'` (chess position with no white king)
 *  - `'antichess'` ([Antichess](https://en.wikipedia.org/wiki/Losing_chess), also known as losing chess, giveaway chess, suicide chess...)
 *  - `'horde'` ([Horde chess](https://en.wikipedia.org/wiki/Dunsany%27s_chess#Horde_chess), following Lichess/Chess.com rules)
 *
 * Variants `'no-king'`, `'white-king-only'` and `'black-king-only'` do not correspond to "real" games. They are mainly provided
 * to create games explaining a particular piece scheme, concept, or sequence of moves... with a reduced number of pieces.
 *
 * @typedef {string} GameVariant
 */
