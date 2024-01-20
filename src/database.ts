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


import { IllegalArgument, InvalidPGN } from './exception';
import { Game } from './game';


export function isValidGameIndex(gameIndex: unknown) {
	return Number.isInteger(gameIndex) && (gameIndex as number) >= 0;
}


/**
 * Describe a set of chess games, each of them being represented by a {@link Game} object.
 */
export abstract class Database {

	/**
	 * @ignore
	 */
	protected constructor() {}

	/**
	 * Number of games in the database.
	 */
	gameCount(): number {
		return this.doGameCount();
	}

	/**
	 * Return the game corresponding to the given index.
	 *
	 * @param gameIndex - Must be between 0 inclusive and {@link Database.gameCount} exclusive.
	 * @throws {@link exception.InvalidPGN} if the corresponding game cannot be parsed, or if the given game index is larger than the number of games in the underlying PGN data.
	 */
	game(gameIndex: number): Game {
		if (!isValidGameIndex(gameIndex)) {
			throw new IllegalArgument('Database.game()');
		}
		return this.doGame(gameIndex);
	}

	/**
	 * Return an [Iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) object allowing to iterate over
	 * all the (valid) games within the database.
	 *
	 * Example, to print the ASCII representation of all the games within a database:
	 * ```
	 * const database = ... ;
	 * for (const game of database.games()) {
	 *   console.log(game.ascii());
	 * }
	 * ```
	 *
	 * If the database contains some games that cannot be parsed (i.e. games for which the method {@link Database.game} would throw a {@link exception.InvalidPGN} exception),
	 * those games are ignored during the iteration. WARNING: for this reason, the number of games returned by the iterator may be lower than {@link Database.gameCount}.
	 */
	games(): Iterable<Game> {
		const gameCount = this.doGameCount();
		const gameLoader = (gameIndex: number) => this.doGame(gameIndex);
		return {
			[Symbol.iterator]() {
				return new GameIteratorImpl(gameCount, gameLoader);
			}
		};
	}

	/**
	 * @ignore
	 */
	protected abstract doGameCount(): number;

	/**
	 * @ignore
	 */
	protected abstract doGame(gameIndex: number): Game;
}


/**
 * Iterator that iterates over all the games of a {@link Database}.
 */
class GameIteratorImpl {

	private gameIndex = 0;
	private gameCount: number;
	private gameLoader: (gameIndex: number) => Game;

	constructor(gameCount: number, gameLoader: (gameIndex: number) => Game) {
		this.gameCount = gameCount;
		this.gameLoader = gameLoader;
	}

	next(): IteratorResult<Game, void> {
		while (this.gameIndex < this.gameCount) {
			try {
				const game = this.gameLoader(this.gameIndex++);
				return { done: false, value: game };
			}
			catch (error) {
				// istanbul ignore if
				if (!(error instanceof InvalidPGN)) {
					throw error;
				}
			}
		}
		return { done: true, value: undefined };
	}

}
