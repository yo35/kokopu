/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2026  Yoann Le Montagner <yo35 -at- melix.net>       *
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
export type ColoredPiece = `${Color}${Piece}`;


/**
 * Chessboard file.
 */
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';


/**
 * Chessboard rank.
 */
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';


/**
 * Chessboard square: `'a1'`, `'a2'`, ..., `'a8'`, `'b1'`, `'b2'`, ..., `'h8'`.
 */
export type Square = `${File}${Rank}`;


/**
 * Ordered pair of chessboard squares: `'a1b2'`, `'g6d3'`, `'d7d7'`, etc...
 */
export type SquareCouple = `${Square}${Square}`;


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
export type Castle960 = `${Color}${File}`;


/**
 * Rank index and file index of a chessboard square.
 */
export type Coordinates = {

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
};


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
