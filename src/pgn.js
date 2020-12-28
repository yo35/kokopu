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

var Separator = '\n';

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
			if (value.substring('960') >= 0) { // allow other styles of Chess960 variant specification
				return 'chess960';
			} else {
				return undefined;
			}
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

	// also add the header to game tags, includes the above tags as well as unknown tags
	game.tags(key, value);
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
	var nodeStack       = [];    // when starting a variation, its parent node (btw., always a 'true' node, not a variation) is stacked here
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
	var errors = [];

	// Parse all games (and return a Database object)...
	if(arguments.length === 1) {
		var games = [];
		while(true) {
			var currentPos = stream.currentPosition();
			try {
				if(!doSkipGame(stream)) {
					break;
				}
				games.push(currentPos);
			}
			catch (err) {
				if (err instanceof exception.InvalidPGN) {
					errors.push({message: err.message, lineno: err.lineNumber});
					// skip this game, but continue
					stream.skipGame();
				}
			}
		}
		return new Database({ text: pgnString, games: games, currentGameIndex: -1, errors: errors }, gameCountGetterImpl, gameGetterImpl);
	}

	// Parse one game...
	else {
		var gameCounter = 0;
		while(gameCounter < gameIndex) {
			if(doSkipGame(stream)) {
				++gameCounter;
			}
			else {
				throw new exception.InvalidPGN(pgnString, pgnString.length, stream._lineCount, i18n.INVALID_GAME_INDEX, gameIndex, gameCounter);
			}
		}
		return doParseGame(stream);
	}
};

/**
 * Write the date in PGN format
 *
 * @param {Date|{year:number, month:number}|{year:number}|undefined}} date
 *
 * @returns {string}
 */
function writeDate(date) {
	if (date === undefined) {
		return '[Date \'????.??.??\']' + Separator;
	} else if (date instanceof Date) {
		return '[Date \'' +
			date.getFullYear().toString() + '.' +
			((date.getMonth() + 1 < 10) ? ('0' + date.getMonth() + 1).toString() : date.getMonth() + 1).toString() + '.' +
			((date.getDate() < 10) ? ('0' + date.getDate().toString()) : date.getDate().toString()) +
			'\']' + Separator;
	} else {
		return '[Date \'' +
			((date.year === undefined) ? '????' : date.year) + '.' +
			((date.month === undefined) ? '??' : date.month) + '.' +
			((date.date === undefined) ? '??' : date.date) +
			'\']' + Separator;
	}
}

/**
 * Write non Seven Tag Roster tags
 * @param {Game} game
 *
 * @returns {string}
 */
function writeNonSTRTags(game) {
	var res = '';
	var STR = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
	if (Object.keys(game.tags()).length > 0) {
		var tags = game.tags();
		for (var tag in game.tags()) {
			if (Object.prototype.hasOwnProperty.call(tags, tag)) {
				var value = tags[tag];
				if (!STR.includes(tag)) {
					res += ('[' + tag + ' \'' + value + '\']' + Separator);
				}
			}
		}
		/*Object.entries(game.tags()).forEach((tag, value) => {
			if (!STR.includes(tag)) {
				res += ('[' + tag + ' \'' + value + '\']' + Separator);
			}
		});*/
	}
	return res;
}

/**
 * Write the headers in order, first the standard ones, then any others
 *
 * @param {Game} game
 *
 * @returns {string}
 */
function writeHeaders(game) {
	var res = '';
	res += '[Event \'' + ((game.event() === undefined) ? '?' : game.event()) + '\']' + Separator;
	res += '[Site \'' + ((game.site() === undefined) ? '?' : game.site()) + '\']' + Separator;
	res += writeDate(game.date());
	res += '[Round \'' + ((game.round() === undefined) ? '?' : game.round()) + '\']' + Separator;
	res += '[White \'' + ((game.playerName('w') === undefined) ? '?' : game.playerName('w')) + '\']' + Separator;
	res += '[Black \'' + ((game.playerName('b') === undefined) ? '?' : game.playerName('b')) + '\']' + Separator;
	res += '[Result \'' + ((game.result() === undefined) ? '*' : game.result()) + '\']' + Separator;
	res += writeNonSTRTags(game);
	return res;
}

/**
 * Write the move number if w, or b if previous node had comments, or variations, or tags
 *
 * @param {Node} node
 * @param {Node} prev
 *
 * @returns {string}
 */
function writeMoveNumber(node, prev) {
	if (node.moveColor() === 'w') {
		return node.fullMoveNumber() + '.';
	} else {
		// black move, only write if the previous node had comments, tags, variations on it
		if (prev === undefined) {
			// black move, without a preceding move
			return node.fullMoveNumber() + '...';
		} else {
			if (prev.comment() !== undefined || prev.tags().length > 0 || prev.variations().length > 0) {
				return node.fullMoveNumber() + '...';
			}
		}
	}
	return ''; // no move number needs to be written out
}

/**
 * Write out the move, comments, annotations and variations for this node
 *
 * @param {Node} node
 * @param {Node} prev
 *
 * @returns {string}
 */
function writeNode(node, prev) {
	var res = '';
	// write move number if w, or b if previous node had comments, or variations, or tags
	res += writeMoveNumber(node, prev);
	res += node.notation() + ' ';

	// wrute the nags for this node
	if (node.nags().length > 0) {
		node.nags().forEach(function (nag) { res += '$' + nag + ' '; });
	}

	// write comment with embedded tags for this node
	if (node.comment() !== undefined) {
		if (node.isLongComment()) {
			res += Separator + '{';
		} else {
			res += '{';
		}
		// write the tags within the comment
		if (node.tags().length > 0) {
			node.tags().forEach(function(key) { res += '[%' + key + ' ' + node.tag(key) + ']'; });
			res += ' ';
		}

		res += node.comment();
		if (node.isLongComment()) {
			res += '}' + Separator;
		} else {
			res += '} ';
		}
	} else {
		// no comments, but might still have tags
		if (node.tags().length > 0) {
			res += '{';
			node.tags().forEach(function(key) { res += '[%' + key + ' ' + node.tag(key) + ']'; });
			res += '} ';
		}
	}

	if (node.variations().length > 0) {
		node.variations().forEach(function(variation) {
			if (variation.isLongVariation()) {
				res += Separator + '(';
			} else {
				res += '(';
			}

			res += writeVariation(variation);

			if (variation.isLongVariation()) {
				res += ')' + Separator;
			} else {
				res += ') ';
			}
		});
	}
	return res;
}

/**
 * Write the moves, annotations, comments and variations within this variation
 *
 * @param {Variation} variation
 *
 * @returns {string}
 */
function writeVariation(variation) {
	var res = '';
	// write the comment, if any
	if (variation.comment() !== undefined) {
		if (variation.isLongComment()) {
			res += Separator + '{';
		} else {
			res += '{';
		}
		// write the tags within the comment
		if (variation.tags().length > 0) {
			variation.tags().forEach(function(key) { res += '[%' + key + ' ' + variation.tag(key) + ']'; });
			res += ' ';
		}

		res += variation.comment();
		if (variation.isLongComment()) {
			res += '}' + Separator;
		} else {
			res += '} ';
		}
	} else {
		// no comments, but might still have tags
		if (variation.tags().length > 0) {
			res += '{';
			variation.tags.forEach(function(key) { res += '[%' + key + ' ' + variation.tag(key) + ']'; });
			res += '} ';
		}
	}

	// write the nags
	if (variation.nags().length > 0) {
		variation.nags().forEach(function(nag) { res += '$' + nag + ' '; });
	}

	// write the moves, node by node
	var prev = undefined;
	variation.nodes().forEach(function(node) { res += writeNode(node, prev); prev = node; });

	return res;
}

/**
 * Write the PGN movetext section with embedded annotations, comments and variations
 *
 * @param {Game} game
 *
 * @returns {string}
 */
function writeMovetext(game) {
	var res = '';
	// we have one main variation, all other variations hang off nodes from it
	res += writeVariation(game.mainVariation());
	return res;
}

/**
 * Break lines to a maximum of lineLength
 *
 * @param {String} str
 * @param {number} n
 *
 * @returns {string}
 */
function breakLines(str, n) {
	if (str.length < n) {
		return str;
	}
	var text = '';
	var segments = str.split(Separator);
	for (var s=0; s < segments.length; s++) {
		if (segments[s].length < n) {
			if (text.length > 0) {
				text += Separator + segments[s].trimEnd();
			} else {
				text = segments[s].trimEnd();
			}
		} else {
			var lines = segments[s].split(' ');
			var res = [];
			for (var i=0; lines.length > 0 && i<lines.length; ) {
				for (var l = 0, line = []; i<lines.length && l + lines[i].length <= n; i++) {
					l += 1 + lines[i].length;
					line.push(lines[i]);
				}
				res.push(line.join(' '));
			}
			if (text.length > 0) {
				text += Separator + res.join(Separator).trimEnd();
			} else {
				text = res.join(Separator).trimEnd();
			}
		}
	}
	return text + ' ';
}

/**
 * Writes a single game and returns as a {string}
 *
 * @param {Game} game
 *
 * @returns {string} the PGN for the game
 */
function pgnWriteSingleGame(game, lineLength) {
	var res = '';
	res += writeHeaders(game);
	res += Separator; // write the separator between headers and movetext
	var moveText = writeMovetext(game);
	res += breakLines(moveText, lineLength || 80);
	res += ((game.result() === undefined) ? '*' : game.result());
	return res;
}

/**
 * Write out the object as PGN
 *
 * @param {Database|Game} obj
 * @param {number} gameIndex
 * @param {number} lineLength (80 default)
 *
 * @returns {string} PGN
 */
exports.pgnWrite = function(obj, gameIndex, lineLength) {
	var res = '';
	gameIndex = gameIndex || 0;
	lineLength = lineLength || 80;
	if (obj instanceof Database) {
		if(arguments.length === 1) {
			// write all games from the database
			var start = true;
			for (var i = 0; i < obj.gameCount(); i++) {
				if (!start) {
					res += Separator + Separator;
				}
				res += pgnWriteSingleGame(obj.game(i), lineLength);
				start = false;
			}
		} else if (gameIndex < obj.gameCount()) {
			// write the gameIndex game from database
			res += pgnWriteSingleGame(obj.game(gameIndex), lineLength);
		} else {
			throw new exception.IllegalArgument('pgnWrite');
		}
	} else if (obj instanceof Game) {
		// write one game
		res += pgnWriteSingleGame(obj, lineLength);
	} else {
		throw new exception.IllegalArgument('pgnWrite');
	}
	return res;
};