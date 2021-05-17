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
	value = value.toLowerCase();
	if(value === 'regular' || value === 'standard') {
		return 'regular';
	}
	else if(value === 'fischerandom' || /^chess[ -]?960$/.test(value)) {
		return 'chess960';
	}
	else if(/^no[ -]king$/.test(value)) {
		return 'no-king';
	}
	else if(/^white[ -]king[ -]only$/.test(value)) {
		return 'white-king-only';
	}
	else if(/^black[ -]king[ -]only$/.test(value)) {
		return 'black-king-only';
	}
	else {
		return undefined;
	}
}


function processHeader(stream, game, initialPositionFactory, key, value, valueCharacterIndex, valueLineIndex) {
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
			initialPositionFactory.fenTokenCharacterIndex = valueCharacterIndex;
			initialPositionFactory.fenTokenLineIndex = valueLineIndex;
			break;

		// The header 'Variant' indicates that this is not a regular chess game.
		case 'Variant':
			initialPositionFactory.variant = parseVariant(value);
			if(!initialPositionFactory.variant) {
				throw new exception.InvalidPGN(stream.text(), valueCharacterIndex, valueLineIndex, i18n.UNKNOWN_VARIANT, value);
			}
			initialPositionFactory.variantTokenCharacterIndex = valueCharacterIndex;
			initialPositionFactory.variantTokenLineIndex = valueLineIndex;
			break;
	}
}


function initializeInitialPosition(stream, game, initialPositionFactory) {

	// Nothing to do if no custom FEN has been defined -> let the default state.
	if(!initialPositionFactory.fen) {
		if(initialPositionFactory.variant && initialPositionFactory.variant !== 'regular') {
			throw new exception.InvalidPGN(stream.text(), initialPositionFactory.variantTokenCharacterIndex, initialPositionFactory.variantTokenLineIndex, i18n.VARIANT_WITHOUT_FEN);
		}
		return;
	}

	try {
		var position = new Position(initialPositionFactory.variant ? initialPositionFactory.variant : 'regular', 'empty');
		var moveCounters = position.fen(initialPositionFactory.fen);
		game.initialPosition(position, moveCounters.fullMoveNumber);
	}
	catch(error) {
		// istanbul ignore else
		if(error instanceof exception.InvalidFEN) {
			throw new exception.InvalidPGN(stream.text(), initialPositionFactory.fenTokenCharacterIndex, initialPositionFactory.fenTokenLineIndex, i18n.INVALID_FEN_IN_PGN_TEXT, error.message);
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

	// State variable for syntactic analysis.
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

		// Set-up the root node when the first move-text token is encountered.
		if(stream.isMoveTextSection() && node === null) {
			initializeInitialPosition(stream, game, initialPositionFactory);
			node = game.mainVariation();
			nodeIsVariation = true;
		}

		// Token type switch
		switch(stream.token()) {

			// Header
			case TokenStream.BEGIN_HEADER:
				if(node !== null) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_PGN_HEADER);
				}
				if(!stream.consumeToken() || stream.token() !== TokenStream.HEADER_ID) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.MISSING_PGN_HEADER_ID);
				}
				var headerId = stream.tokenValue();
				if(!stream.consumeToken() || stream.token() !== TokenStream.HEADER_VALUE) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.MISSING_PGN_HEADER_VALUE);
				}
				var headerValue = stream.tokenValue();
				var headerValueCharacterIndex = stream.tokenCharacterIndex();
				var headerValueLineIndex = stream.tokenLineIndex();
				if(!stream.consumeToken() || stream.token() !== TokenStream.END_HEADER) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.MISSING_END_OF_PGN_HEADER);
				}
				processHeader(stream, game, initialPositionFactory, headerId, headerValue, headerValueCharacterIndex, headerValueLineIndex);
				break;

			// Move number
			case TokenStream.MOVE_NUMBER:
				break;

			// Move or null-move
			case TokenStream.MOVE:
				try {
					node = node.play(stream.tokenValue());
					nodeIsVariation = false;
				}
				catch(error) {
					// istanbul ignore else
					if(error instanceof exception.InvalidNotation) {
						throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.INVALID_MOVE_IN_PGN_TEXT, error.notation, error.message);
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
					node.tag(key, tags[key]);
				}
				if(stream.tokenValue().comment !== undefined) {
					node.comment(stream.tokenValue().comment, stream.emptyLineFound());
				}
				break;

			// Begin of variation
			case TokenStream.BEGIN_VARIATION:
				if(nodeIsVariation) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_BEGIN_OF_VARIATION);
				}
				nodeStack.push(node);
				node = node.addVariation(stream.emptyLineFound());
				nodeIsVariation = true;
				break;

			// End of variation
			case TokenStream.END_VARIATION:
				if(nodeStack.length === 0) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_END_OF_VARIATION);
				}
				node = nodeStack.pop();
				nodeIsVariation = false;
				break;

			// End-of-game
			case TokenStream.END_OF_GAME:
				if(nodeStack.length > 0) {
					throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_END_OF_GAME);
				}
				game.result(stream.tokenValue());
				return game;

			// Something unexpected...
			default:
				throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.INVALID_PGN_TOKEN);

		} // switch(stream.token())

	} // while(stream.consumeToken())

	throw new exception.InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_END_OF_TEXT);
}


function gameCountGetterImpl(impl) {
	return impl.gameLocations.length;
}


function gameGetterImpl(impl, gameIndex) {
	if(impl.currentGameIndex !== gameIndex) {
		impl.stream = new TokenStream(impl.text, impl.gameLocations[gameIndex]);
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
	var stream = new TokenStream(pgnString);

	// Parse all games (and return a Database object)...
	if(arguments.length === 1) {
		var gameLocations = [];
		while(true) {
			var currentLocation = stream.currentLocation();
			if(!stream.skipGame()) {
				break;
			}
			gameLocations.push(currentLocation);
		}
		return new Database({ text: pgnString, gameLocations: gameLocations, currentGameIndex: -1 }, gameCountGetterImpl, gameGetterImpl);
	}

	// Parse one game...
	else {
		var gameCounter = 0;
		while(gameCounter < gameIndex) {
			if(stream.skipGame()) {
				++gameCounter;
			}
			else {
				throw new exception.InvalidPGN(pgnString, -1, -1, i18n.INVALID_GAME_INDEX, gameIndex, gameCounter);
			}
		}
		return doParseGame(stream);
	}
};
