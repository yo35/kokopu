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


import { IllegalArgument } from './exception';
import { Game } from './game';


export function isValidGameIndex(gameIndex: any) {
	return Number.isInteger(gameIndex) && gameIndex >= 0;
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
	abstract gameCount(): number;

	/**
	 * Return the game corresponding to the given index.
	 *
	 * @param gameIndex - Must be between 0 inclusive and {@link Database.gameCount} exclusive.
	 */
	game(gameIndex: number): Game {
		if (!isValidGameIndex(gameIndex) || gameIndex >= this.gameCount()) {
			throw new IllegalArgument('Database.game()');
		}
		return this.doGame(gameIndex);
	}

	protected abstract doGame(gameIndex: number): Game;
}
