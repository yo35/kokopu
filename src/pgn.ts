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


import { Database, isValidGameIndex } from './database';
import { IllegalArgument } from './exception';
import { Game } from './game';

import { readDatabase, readOneGame } from './private_pgn/pgn_read_impl';
import { writeGame, writeGames, PGNWriteOptions } from './private_pgn/pgn_write_impl';


/**
 * PGN parsing function.
 *
 * @param pgnString - String to parse.
 */
export function pgnRead(pgnString: string): Database;

/**
 * PGN parsing function.
 *
 * @param pgnString - String to parse.
 * @param gameIndex - Only the game corresponding to this index is parsed. Must be between 0 (inclusive) and the number of games in the PGN (exclusive).
 * @throws {@link exception.InvalidPGN} if the corresponding game cannot be parsed, or if the given game index is larger than the number of games in the underlying PGN string.
 */
export function pgnRead(pgnString: string, gameIndex: number): Game;

export function pgnRead(pgnString: string, gameIndex?: number) {
	if (typeof pgnString !== 'string') {
		throw new IllegalArgument('pgnRead()');
	}

	if (arguments.length === 1) { // Parse all games (and return a Database object)...
		return readDatabase(pgnString);
	}
	else { // Parse one game...
		if (!isValidGameIndex(gameIndex)) {
			throw new IllegalArgument('pgnRead()');
		}
		return readOneGame(pgnString, gameIndex!);
	}
}


/**
 * PGN writing function.
 */
export function pgnWrite(game: Game, options?: PGNWriteOptions): string;

/**
 * PGN writing function.
 *
 * @param games - Games to write.
 */
export function pgnWrite(games: Game[], options?: PGNWriteOptions): string;

export function pgnWrite(gameOrGames: Game | Game[], options?: PGNWriteOptions) {
	if (options === undefined || options === null) {
		options = {};
	}
	if (gameOrGames instanceof Game) {
		return writeGame(gameOrGames, options);
	}
	else if (Array.isArray(gameOrGames) && gameOrGames.every(game => game instanceof Game)) {
		return writeGames(gameOrGames, options);
	}
	else {
		throw new IllegalArgument('pgnWrite()');
	}
}
