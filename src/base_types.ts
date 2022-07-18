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


/**
 * Chess color, i.e. either `'w'` (white) or `'b'` (black).
 */
export type Color = 'w' | 'b';


/**
 * Type of chess (uncolored) piece:
 * 
 * - `'k'` (king),
 * - `'q'` (queen),
 * - `'r'` (rook),
 * - `'b'` (bishop),
 * - `'n'` (knight),
 * - `'p'` (pawn).
 */
export type Piece = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';


/**
 * Type of chess colored piece: `'wk'` (white king), `'br'` (black rook), etc...
 */
export type ColoredPiece =
	'wk' | 'wq' | 'wr' | 'wb' | 'wn' | 'wp' |
	'bk' | 'bq' | 'br' | 'bb' | 'bn' | 'bp';


/**
 * Castle type at chess:
 * - `'wk'` (white king-side castle)
 * - `'wq'` (white queen-side castle)
 * - `'bk'` (black king-side castle)
 * - `'bq'` (black queen-side castle)
 */
export type Castle = 'wk' | 'wq' | 'bk' | 'bq';


/**
 * Castle type at Chess960:
 * - `'wa'` (white castle with rook on the file A)
 * - `'wb'` (white castle with rook on the file B)
 * - `'wc'` (white castle with rook on the file C)
 * - ...
 * - `'bh'` (black castle with rook on the file H)
 */
export type Castle960 =
	'wa' | 'wb' | 'wc' | 'wd' | 'we' | 'wf' | 'wg' | 'wh' |
	'ba' | 'bb' | 'bc' | 'bd' | 'be' | 'bf' | 'bg' | 'bh';


/**
 * Chessboard file.
 */
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';


/**
 * Chessboard rank.
 */
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';


/**
 * Chessboard square.
 */
export type Square =
	'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' |
	'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
	'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
	'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
	'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
	'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
	'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
	'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';


/**
 * Rank index and file index of a chessboard square.
 */
export interface Coordinates {

	/**
	 * - `0` for file A
	 * - `1` for file B
	 * - ...
	 * - `7` for file H
	 */
	file: number,

	/**
	 * - `0` for rank 1
	 * - `1` for rank 2
	 * - ...
	 * - `7` for rank 8
	 */
	rank: number,
}


/**
 * Result of a chess game.
 *
 * - `'1-0'` (white wins),
 * - `'1/2-1/2'` (draw),
 * - `'0-1'` (black wins),
 * - `'*'` (unfinished game, or undefined result).
 */
export type GameResult = '1-0' | '1/2-1/2' | '0-1' | '*';


/**
 * Variant of the chess game rules.
 *
 * - `'regular'` (regular chess rules),
 * - `'chess960'` ([Chess960](https://en.wikipedia.org/wiki/Chess960), also known as Fischer Random Chess).
 * - `'no-king'` (chess position without any king)
 * - `'white-king-only'` (chess position with no black king)
 * - `'black-king-only'` (chess position with no white king)
 * - `'antichess'` ([Antichess](https://en.wikipedia.org/wiki/Losing_chess), also known as losing chess, giveaway chess, suicide chess...)
 * - `'horde'` ([Horde chess](https://en.wikipedia.org/wiki/Dunsany%27s_chess#Horde_chess), following Lichess/Chess.com rules)
 *
 * Variants `'no-king'`, `'white-king-only'` and `'black-king-only'` do not correspond to "real" games. They are mainly provided
 * to create games explaining a particular piece scheme, concept, or sequence of moves... with a reduced number of pieces.
 */
export type GameVariant = 'regular' | 'chess960' | 'no-king' | 'white-king-only' | 'black-king-only' | 'antichess' | 'horde';


/**
 * Date of a chess game. It can be either partially defined (with the year only, or with the year and month but without day of month),
 * or fully defined (with year, month and day of month).
 *
 * When it is present, the `month` field is an integer valued between 1 (January) and 12 (December) inclusive.
 * When it is present, the `day` month is an integer valued between 1 and the number of days in the corresponding month (thus 31 at most).
 */
export type DateValue =
	{ type: 'y', year: number } |
	{ type: 'ym', year: number, month: number } |
	{ type: 'ymd', year: number, month: number, day: number };
