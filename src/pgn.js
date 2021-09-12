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


var Game = require('./game').Game;
var pgnReadImpl = require('./private_game/pgn_read_impl');
var pgnWriteImpl = require('./private_game/pgn_write_impl');


/**
 * PGN parsing function.
 *
 * @param {string} pgnString String to parse.
 * @returns {Database}
 * @throws {module:exception.InvalidPGN}
 *
 *//**
 *
 * PGN parsing function.
 *
 * @param {string} pgnString String to parse.
 * @param {number} gameIndex Only the game corresponding to this index is parsed.
 * @returns {Game}
 * @throws {module:exception.InvalidPGN}
 */
exports.pgnRead = function() {

	// Parse all games (and return a Database object)...
	if(arguments.length === 1) {
		return pgnReadImpl.readDatabase(arguments[0]);
	}

	// Parse one game...
	else {
		return pgnReadImpl.readOneGame(arguments[0], arguments[1]);
	}
};


/**
 * PGN writing function.
 *
 * @param {Game} game Game to write.
 * @returns {string}
 *
 *//**
 *
 * PGN writing function.
 *
 * @param {Game[]} games Games to write.
 * @returns {string}
 */
exports.pgnWrite = function(input) {
	if (input instanceof Game) {
		return pgnWriteImpl.writeGames([ input ]);
	}
	else {
		return pgnWriteImpl.writeGames(input);
	}
};
