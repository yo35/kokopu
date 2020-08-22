/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2020  Yoann Le Montagner <yo35 -at- melix.net>       *
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


var exception = require('./exception');
var i18n = require('./i18n');

var Position = require('./position').Position;
var Game = require('./game').Game;
var Database = require('./database').Database;
var TokenStream = require('./private_pgn/tokenstream').TokenStream;


function parseNullableHeader(value) {
	return value === '?' ? undefined : value;
}


function parseDateHeader(value) {
	if(/^([0-9]{4})\.([0-9]{2})\.([0-9]{2})$/.test(value)) {
		var year = RegExp.$1;
		var month = RegExp.$2;
		var day = RegExp.$3;
		year = parseInt(year, 10);
		month = parseInt(month, 10);
		day = parseInt(day, 10);
		if(month >= 1 && month <= 12 && day >= 1 && day <= 31) {
			return new Date(year, month - 1, day);
		}
	}
	else if(/^([0-9]{4})\.([0-9]{2})\.\?\?$/.test(value)) {
		var year = RegExp.$1;
		var month = parseInt(RegExp.$2, 10);
		if(month >= 1 && month <= 12) {
			return { year: parseInt(year, 10), month: month };
		}
	}
	else if(/^([0-9]{4})(?:\.\?\?\.\?\?)?$/.test(value)) {
		return { year: parseInt(RegExp.$1, 10) };
	}
	return undefined;
}


function parseVariant(value) {
	switch(value.toLowerCase()) {
		case 'regular':
		case 'standard':
			return 'regular';
		case 'chess960':
		case 'fischerandom':
			return 'chess960';
		case 'no king':
			return 'no-king';
		case 'white king only':
			return 'white-king-only';
		case 'black king only':
			return 'black-king-only';
		default:
			return undefined;
	}
}


function processHeader(stream, game, initialPositionFactory, key, value) {
	value = value.trim();
	switch(key) {
		case 'White': game.playerName('w', parseNullableHeader(value)); break;
		case 'Black': game.playerName('b', parseNullableHeader(value)); break;
		case 'WhiteElo': game.playerElo('w', value); break;
		case 'BlackElo': game.playerElo('b', value); break;
		case 'WhiteTitle': game.playerTitle('w', value); break;
		case 'BlackTitle': game.playerTitle('b', value); break;
		case 'Event': game.event(parseNullableHeader(value)); break;
		case 'Round': game.round(parseNullableHeader(value)); break;
		case 'Date': game.date(parseDateHeader(value)); break;
		case 'Site': game.site(parseNullableHeader(value)); break;
		case 'Annotator': game.annotator(value); break;

		// The header 'FEN' has a special meaning, in that it is used to define a custom
		// initial position, that may be different from the usual one.
		case 'FEN':
			initialPositionFactory.fen = value;
			initialPositionFactory.fenTokenIndex = stream.tokenIndex();
			break;

		// The header 'Variant' indicates that this is not a regular chess game.
		case 'Variant':
			initialPositionFactory.variant = parseVariant(value);
			if(!initialPositionFactory.variant) {
				throw stream.invalidPGNException(i18n.UNKNOWN_VARIANT, value);
			}
			break;
	}
}


function initializeInitialPosition(stream, game, initialPositionFactory) {

	// Nothing to do if no custom FEN has been defined -> let the default state.
	if(!initialPositionFactory.fen) {
		if(initialPositionFactory.variant && initialPositionFactory.variant !== 'regular') {
			throw stream.invalidPGNException(i18n.VARIANT_WITHOUT_FEN);
		}
		return;
	}

	try {
		var position = new Position(initialPositionFactory.variant ? initialPositionFactory.variant : 'regular', 'empty');
		var moveCounters = position.fen(initialPositionFactory.fen);
		game.initialPosition(position, moveCounters.fullMoveNumber);
	}
	catch(error) {
		if(error instanceof exception.InvalidFEN) {
			throw stream.invalidPGNException(initialPositionFactory.fenTokenIndex, i18n.INVALID_FEN_IN_PGN_TEXT, error.message);
		}
		else {
			throw error;
		}
	}
}


/**
 * Parse exactly 1 game from the given stream.
 *
 * @param {TokenStream} stream
 * @returns {Game}
 * @throws {module:exception.InvalidPGN}
 * @ignore
 */
function doParseGame(stream) {

	// State variable for syntaxic analysis.
	var game            = null;  // the result
	var node            = null;  // current node (or variation) to which the next move should be appended
	var nodeIsVariation = false; // whether the current node is a variation or not
	var nodeStack       = [];    // when starting a variation, its parent node (btw., always a "true" node, not a variation) is stacked here
	var initialPositionFactory = {};

	// Token loop
	while(stream.consumeToken()) {

		// Create a new game if necessary
		if(game === null) {
			game = new Game();
		}

		// Matching anything else different from a header means that the move section
		// is going to be parse => set-up the root node.
		if(stream.token() !== TokenStream.HEADER && node === null) {
			initializeInitialPosition(stream, game, initialPositionFactory);
			node = game.mainVariation();
			nodeIsVariation = true;
		}

		// Token type switch
		switch(stream.token()) {

			// Header
			case TokenStream.HEADER:
				if(node !== null) {
					throw stream.invalidPGNException(i18n.UNEXPECTED_PGN_HEADER);
				}
				processHeader(stream, game, initialPositionFactory, stream.tokenValue().key, stream.tokenValue().value);
				break;

			// Move or null-move
			case TokenStream.MOVE:
				try {
					node = node.play(stream.tokenValue());
					nodeIsVariation = false;
				}
				catch(error) {
					if(error instanceof exception.InvalidNotation) {
						throw stream.invalidPGNException(i18n.INVALID_MOVE_IN_PGN_TEXT, error.notation, error.message);
					}
					else {
						throw error;
					}
				}
				break;

			// NAG
			case TokenStream.NAG:
				node.addNag(stream.tokenValue());
				break;

			// Comment
			case TokenStream.COMMENT:
				var tags = stream.tokenValue().tags;
				for(var key in tags) {
					if(tags[key] !== undefined) {
						node.tag(key, tags[key]);
					}
				}
				if(stream.tokenValue().comment !== undefined) {
					node.comment(stream.tokenValue().comment, stream.emptyLineFound());
				}
				break;

			// Begin of variation
			case TokenStream.BEGIN_VARIATION:
				if(nodeIsVariation) {
					throw stream.invalidPGNException(i18n.UNEXPECTED_BEGIN_OF_VARIATION);
				}
				nodeStack.push(node);
				node = node.addVariation(stream.emptyLineFound());
				nodeIsVariation = true;
				break;

			// End of variation
			case TokenStream.END_VARIATION:
				if(nodeStack.length === 0) {
					throw stream.invalidPGNException(i18n.UNEXPECTED_END_OF_VARIATION);
				}
				node = nodeStack.pop();
				nodeIsVariation = false;
				break;

			// End-of-game
			case TokenStream.END_OF_GAME:
				if(nodeStack.length > 0) {
					throw stream.invalidPGNException(i18n.UNEXPECTED_END_OF_GAME);
				}
				game.result(stream.tokenValue());
				return game;

		} // switch(stream.token())

	} // while(stream.consumeToken())

	throw stream.invalidPGNException(i18n.UNEXPECTED_END_OF_TEXT);
}


/**
 * Skip 1 game in the given stream.
 *
 * @param {TokenStream} stream
 * @returns {boolean} `true` if a game has been skipped, false if the end of the stream has been reached.
 * @throws {module:exception.InvalidPGN}
 * @ignore
 */
function doSkipGame(stream) {
	var atLeastOneTokenFound = false;
	while(stream.consumeToken()) {
		atLeastOneTokenFound = true;
		if(stream.token() === TokenStream.END_OF_GAME) {
			return true;
		}
	}

	// If the end of the stream has been reached without seeing any END_OF_GAME token, then no token should have been seen at all.
	// Throw an exception if this is not the case.
	if(atLeastOneTokenFound) {
		throw stream.invalidPGNException(i18n.UNEXPECTED_END_OF_TEXT);
	}
	return false;
}


function gameCountGetterImpl(impl) {
	return impl.games.length;
}


function gameGetterImpl(impl, gameIndex) {
	if(impl.currentGameIndex !== gameIndex) {
		impl.stream = new TokenStream(impl.text, impl.games[gameIndex]);
	}
	impl.currentGameIndex = -1;
	var result = doParseGame(impl.stream);
	impl.currentGameIndex = gameIndex + 1;
	return result;
}


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
exports.pgnRead = function(pgnString, gameIndex) {
	var stream = new TokenStream(pgnString, 0);

	// Parse all games (and return a Database object)...
	if(arguments.length === 1) {
		var games = [];
		while(true) {
			var currentPos = stream.currentPosition();
			if(!doSkipGame(stream)) {
				break;
			}
			games.push(currentPos);
		}
		return new Database({ text: pgnString, games: games, currentGameIndex: -1 }, gameCountGetterImpl, gameGetterImpl);
	}

	// Parse one game...
	else {
		var gameCounter = 0;
		while(gameCounter < gameIndex) {
			if(doSkipGame(stream)) {
				++gameCounter;
			}
			else {
				throw new exception.InvalidPGN(pgnString, pgnString.length, i18n.INVALID_GAME_INDEX, gameIndex, gameCounter);
			}
		}
		return doParseGame(stream);
	}
};
