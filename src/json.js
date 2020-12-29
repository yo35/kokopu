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
var bt = require('./basetypes');

var Position = require('./position').Position;
var Game = require('./game').Game;
var Database = require('./database').Database;

// Move types:
var MoveSize = 2;
var MoveNone = 0;
var MoveNull = 65;
var MoveSpecial = 455;

// Special moves:
var Annotation = ((0x1 << 12) | MoveSpecial);
var TextComment = ((0x2 << 12) | MoveSpecial);
var LongTextComment = ((0x3 << 12) | MoveSpecial);
var Tag = ((0x4 << 12) | MoveSpecial);
var StartVariation = ((0x5 << 12) | MoveSpecial);
var StartLongVariation = ((0x6 << 12) | MoveSpecial);
var EndVariation = ((0x7 << 12) | MoveSpecial);
var Result = ((0x8 << 12) | MoveSpecial);
var Extension = ((0xE << 12) | MoveSpecial);
var EndMoveText = ((0xF << 12) | MoveSpecial);

// Results
var Unknown = 0; // 0b00
var BlackWins = 1; // 0b01
var WhiteWins = 2; // 0b10
var Draw = 3; // 0b11

var SupportedHeaders = ['Event', 'Site', 'Date', 'Round', 'White', 'WhiteElo', 'WhiteTitle',
	'Black', 'BlackElo', 'BlackTitle', 'Annotator', 'Result'];

/**
* Write the date in PGN format
*
* @param {Date|{year:number, month:number}|{year:number}|undefined}} date
* @param {Object} res
*
* @returns {Object}
*/
function writeDate(date, res) {
	if (date === undefined) {
		res.Date = '';
	} else if (date instanceof Date) {
		res.Date = date.getFullYear().toString() +
			((date.getMonth() + 1 < 10) ? ('0' + (date.getMonth() + 1).toString()) : (date.getMonth() + 1).toString()) +
			((date.getDate() < 10) ? ('0' + date.getDate()).toString() : date.getDate().toString());
	} else {
		res.Date = ((date.year === undefined) ? '0000' : date.year) +
			((date.month === undefined) ? '00' : (date.month < 10) ? '0' + date.month.toString() : date.month.toString()) + '00';
	}
	return res;
}

/**
* Write additional headers that aren't already in the supported game headers
* @param {Game} game
* @param {Object} res
*
* @returns {Object}
*/
function writeAdditionalHeaders(game, res) {
	if (Object.keys(game.headers()).length > 0) {
		var headers = game.headers();
		for (var header in game.headers()) {
			if (Object.prototype.hasOwnProperty.call(headers, header)) {
				var value = headers[header];
				if (!SupportedHeaders.includes(header)) {
					res[header] = value;
				}
			}
		}
		/*Object.entries(game.headers()).forEach((header, value) => {
			if (!SupportedHeaders.includes(header)) {
				res += ('[' + header + ' \'' + value + '\']' + Separator);
			}
		});*/
	}
	return res;
}

/**
* Write the headers in order, first the standard ones, then any others
*
* @param {Game} game
* @param {Object} res
*
* @returns {Object}
*/
function writeHeaders(game, res) {
	res.Event = ((game.event() === undefined) ? '?' : game.event());
	res.Site = ((game.site() === undefined) ? '?' : game.site());
	res = writeDate(game.date(), res);
	res.Round = ((game.round() === undefined) ? '?' : game.round());
	res.White = ((game.playerName('w') === undefined) ? '?' : game.playerName('w'));
	res.Black = ((game.playerName('b') === undefined) ? '?' : game.playerName('b'));
	if (game.playerElo('w') !== undefined) {
		res.WhiteElo = ((game.playerElo('w') === undefined) ? '?' : game.playerElo('w'));
	}
	if (game.playerElo('b') !== undefined) {
		res.BlackElo = ((game.playerElo('b') === undefined) ? '?' : game.playerElo('b'));
	}
	if (game.playerTitle('w') !== undefined) {
		res.WhiteTitle = ((game.playerTitle('w') === undefined) ? '?' : game.playerTitle('w'));
	}
	if (game.playerTitle('b') !== undefined) {
		res.BlackTitle = ((game.playerTitle('b') === undefined) ? '?' : game.playerTitle('b'));
	}
	if (game.annotator() !== undefined) {
		res.Annotator = game.annotator();
	}
	res.Result = ((game.result() === undefined) ? '*' : game.result());
	res = writeAdditionalHeaders(game, res);
	return res;
}

/**
* Write comment to res
* @param {string} comment
* @param {boolean} isLongComment
* @param {*} res
*
* @returns {Object}
*/
function writeComment(comment, isLongComment, res) {
	var buf = Buffer.allocUnsafe(MoveSize + comment.length + 1);
	var offset = 0;
	buf.writeUInt16BE(isLongComment ? LongTextComment : TextComment, offset); offset += MoveSize;
	buf.write(comment, offset); offset += comment.length;
	buf.writeUInt8(0, offset);
	res.buf = Buffer.concat([res.buf, buf]);
	return res;
}

/**
* Write tag to res
* @param {string} tag
* @param {string} value
* @param {*} res
*
* @returns {Object}
*/
function writeTag(tag, value, res) {
	var buf = Buffer.allocUnsafe(MoveSize + tag.length + 1 + value.length + 1);
	var offset = 0;
	buf.writeUInt16BE(Tag, offset); offset += MoveSize;
	buf.write(tag, offset); offset += tag.length;
	buf.writeUInt8(0, offset); offset++;
	buf.write(value, offset); offset += value.length;
	buf.writeUInt8(0, offset); offset++;
	res.buf = Buffer.concat([res.buf, buf]);
	return res;
}

/**
* Write nag to res
* @param {number} nag
* @param {*} res
*
* @returns {Object}
*/
function writeNag(nag, res) {
	var buf = Buffer.allocUnsafe(MoveSize + 1);
	var offset = 0;
	buf.writeUInt16BE(Annotation, offset); offset += MoveSize;
	buf.writeUInt8(Number(nag), offset);
	res.buf = Buffer.concat([res.buf, buf]);
	return res;
}

/**
*
* @param {MoveDescriptor} move
* @param {number} variationDepth how deep we are in a variation tree
* @param {Object} res
*
* @return {Object}
*/
function writeMove(move, variationDepth, res) {
	// A move needs 16 bits to be stored

	// bit  0- 5: destination square (from 0 to 63)
	// bit  6-11: origin square (from 0 to 63)
	// bit 12-13: promotion piece type (from KNIGHT-0, BISHOP-1, ROOK-2, QUEEN-3)
	// bit 14-15: special move flag: normal (0), promotion (1), en passant (2), castling (3)
	// NOTE: EN-PASSANT bit is set only when a pawn can be captured

	var buf = Buffer.alloc(MoveSize);

	if (move === undefined) {
		buf.writeUInt16BE(MoveNull);
	} else {
		var from = bt.squareToBoardOffset(move.from());
		var to = bt.squareToBoardOffset(move.to());
		var type = (move.isPromotion() ? 1 : ((move.isEnPassant() ? 2 : (move.isCastling() ? 3 : 0))));
		var piece = 0;

		if (move.isPromotion()) {
			switch (move.promotion()) {
				case 'q':
					piece = 3;
					break;
				case 'r':
					piece = 2;
					break;
				case 'b':
					piece = 1;
					break;
				case 'n':
					piece = 0;
					break;
			}
		}
		buf.writeUInt16BE((type << 14 | piece << 12 | from << 6 | to), 0);
	}
	res.buf = Buffer.concat([res.buf, buf]);

	// maintain main variation separately as well
	if (variationDepth === 0) {
		var main = Buffer.alloc(MoveSize);
		buf.copy(main);
		res.main = Buffer.concat([res.main, main]);
	}
	return res;
}

/**
* Write out the move, comments, annotations and variations for this node
*
* @param {Node} node
* @param {number} variationDepth
* @param {Object} res
*
* @returns {Object}
*/
function writeNode(node, variationDepth, res) {

	// write move
	res = writeMove(node.move(), variationDepth, res);

	// wrute the nags for this node
	if (node.nags().length > 0) {
		node.nags().forEach(function (nag) { res = writeNag(nag, res); });
	}

	// write the comment, if any
	if (node.comment() !== undefined) {
		res = writeComment(node.comment(), node.isLongComment(), res);
	}

	// write the tags
	if (node.tags().length > 0) {
		node.tags().forEach(function (key) { res = writeTag(key, node.tag(key), res); });
	}

	if (node.variations().length > 0) {
		node.variations().forEach(function (variation) {
			res = writeVariation(variation, variation.isLongVariation(), false, variationDepth + 1, res);
		});
	}
	return res;
}

/**
* Write the moves, annotations, comments and variations within this variation
*
* @param {Variation} variation
* @param {boolean} isLongVariation
* @param {number} variationDepth
* @param {Object} res
*
* @returns {Object}
*/
function writeVariation(variation, isLongVariation, isMainVariation, variationDepth, res) {
	if (!isMainVariation) {
		var buf = Buffer.allocUnsafe(MoveSize);
		buf.writeUInt16BE(isLongVariation ? StartLongVariation : StartVariation, 0);
		res.buf = Buffer.concat([res.buf, buf]);
	}

	// write the comment, if any
	if (variation.comment() !== undefined) {
		res = writeComment(variation.comment(), variation.isLongComment(), res);
	}

	// write the tags
	if (variation.tags().length > 0) {
		variation.tags().forEach(function (key) { res = writeTag(key, variation.tag(key), res); });
	}

	// write the nags
	if (variation.nags().length > 0) {
		variation.nags().forEach(function (nag) { res = writeNag(nag, res); });
	}

	// write the moves, node by node
	variation.nodes().forEach(function (node) { res = writeNode(node, variationDepth, res); });

	if (!isMainVariation) {
		// end variation
		buf = Buffer.allocUnsafe(MoveSize);
		buf.writeUInt16BE(EndVariation, 0);
		res.buf = Buffer.concat([res.buf, buf]);
	}
	return res;
}

/**
* Write game result
* @param {Game} game
* @param {Object} res
*
* @return {Object}
*/
function writeResult(game, res) {
	var result = ((game.result() === undefined) ? '*' : game.result());
	var buf = Buffer.allocUnsafe(MoveSize + 1);
	var offset = 0;
	buf.writeUInt16BE(Result, 0); offset += MoveSize;
	switch (result) {
		case '1-0':
			buf.writeUInt8(WhiteWins, offset);
			break;
		case '0-1':
			buf.writeUInt8(BlackWins, offset);
			break;
		case '1/2-1/2':
			buf.writeUInt8(Draw, offset);
			break;
		case '*':
		default:
			buf.writeUInt8(Unknown, offset);
			break;
	}
	res.buf = Buffer.concat([res.buf, buf]);
	return res;
}

/**
* Write the PGN movetext section with embedded annotations, comments and variations
*
* @param {Game} game
*
* @returns {Object} JSON object for the movetext - this is a binary base64 encoded string
*/
function writeMovetext(game, res) {
	// start move text
	var buf = Buffer.allocUnsafe(MoveSize);
	buf.writeUInt16BE(MoveNone, 0);
	res.buf = buf;
	// start main variation
	buf = Buffer.allocUnsafe(MoveSize);
	buf.writeUInt16BE(MoveNone, 0);
	res.main = buf;

	// we have one main variation, all other variations hang off nodes from it
	res = writeVariation(game.mainVariation(), true, true, 0, res);
	res = writeResult(game, res);

	// end movetext
	buf = Buffer.allocUnsafe(MoveSize);
	buf.writeUInt16BE(EndMoveText, 0);
	res.buf = Buffer.concat([res.buf, buf]);

	// end main variation
	buf = Buffer.allocUnsafe(MoveSize);
	buf.writeUInt16BE(EndMoveText, 0);
	res.main = Buffer.concat([res.main, buf]);
	return res;
}

/**
* Writes a single game and returns an object corresponding to the game
*
* @param {Game} game
* @param {Object} res
*
* @returns {Object} JSON object for the game
*/
function jsonEncodeSingleGame(game, res) {
	res = writeHeaders(game, res);
	res = writeMovetext(game, res);
	res.MoveText = res.buf.toString('base64');
	delete res.buf;
	res.MainVariation = res.main.toString('base64');
	delete res.main;
	return res;
}

/**
* Write out the object as PGN
*
* @param {Database|Game} obj
* @param {number} gameIndex
*
* @returns {Array} Array of JSON objects
*/
exports.jsonEncode = function (obj, gameIndex) {
	var res = [];
	var start = {};
	gameIndex = gameIndex || 0;
	if (obj instanceof Database) {
		if (arguments.length === 1) {
			// jsonify all games from the database
			for (var i = 0; i < obj.gameCount(); i++) {
				start = {};
				res.push(jsonEncodeSingleGame(obj.game(i), start));
			}
		} else if (gameIndex < obj.gameCount()) {
			// jsonify the gameIndex game from database
			start = {};
			start.buf = Buffer.alloc(2, MoveNull);
			res.push(jsonEncodeSingleGame(obj.game(gameIndex), start));
		} else {
			throw new exception.IllegalArgument('jsonEncodeSingleGame');
		}
	} else if (obj instanceof Game) {
		// jsonify one game
		start.buf = Buffer.alloc(2, MoveNull);
		res.push(jsonEncodeSingleGame(obj, start));
	} else {
		throw new exception.IllegalArgument('jsonEncodeSingleGame');
	}
	return res;
};

function parseNullableHeader(value) {
	return value === '?' ? undefined : value;
}

function parseDateHeader(value) {
	var year = value.slice(0, 4);
	var month = value.slice(4, 6);
	var day = value.slice(6, 8);

	var res = {
		year: (year === '0000' || year.length === 0 ? undefined : Number(year)),
		month: (month === '00' || month.length === 0 ? undefined : Number(month)),
		day: (day === '00' || day.length === 0 ? undefined : Number(day))
	};
	if (res.year === undefined) {
		return undefined;
	} else if (res.year !== undefined && res.month !== undefined && res.day !== undefined) {
		return new Date(res.year, res.month - 1, res.day);
	} else {
		delete res.day;
		return res;
	}
}

function parseVariant(value) {
	switch (value.toLowerCase()) {
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

function processHeader(game, initialPositionFactory, key, value) {
	value = value.trim();
	switch (key) {
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
			break;

		// The header 'Variant' indicates that this is not a regular chess game.
		case 'Variant':
			initialPositionFactory.variant = parseVariant(value);
			if (!initialPositionFactory.variant) {
				throw new exception.InvalidJSON(null, null, i18n.UNKNOWN_VARIANT, value);
			}
			break;
	}

	// also add the header to game tags, includes the above tags as well as unknown tags
	game.headers(key, value);
}

function initializeInitialPosition(game, initialPositionFactory) {

	// Nothing to do if no custom FEN has been defined -> let the default state.
	if (!initialPositionFactory.fen) {
		if (initialPositionFactory.variant && initialPositionFactory.variant !== 'regular') {
			throw new exception.InvalidJSON(null, null, i18n.VARIANT_WITHOUT_FEN);
		}
		return;
	}

	try {
		var position = new Position(initialPositionFactory.variant ? initialPositionFactory.variant : 'regular', 'empty');
		var moveCounters = position.fen(initialPositionFactory.fen);
		game.initialPosition(position, moveCounters.fullMoveNumber);
	}
	catch (error) {
		if (error instanceof exception.InvalidFEN) {
			throw new exception.InvalidJSON(null, initialPositionFactory.fenTokenIndex, i18n.INVALID_FEN_IN_PGN_TEXT, error.message);
		}
		else {
			throw error;
		}
	}
}

/**
* Parse exactly 1 game from the given stream.
*
* @param {Object} obj
* @returns {Game}
* @throws {module:exception.InvalidJSON}
* @ignore
*/
function doParseGame(obj) {

	// State variable for syntaxic analysis.
	var game = null;  // the result
	var node = null;  // current node (or variation) to which the next move should be appended
	var nodeIsVariation = false; // whether the current node is a variation or not
	var nodeStack = [];    // when starting a variation, its parent node (btw., always a 'true' node, not a variation) is stacked here
	var initialPositionFactory = {};

	// Keys loop
	if (Object.keys(obj).length > 0) {
		var keys = Object.keys(obj);
		keys.forEach(function (key) {
			if (key === 'MoveText') {
				return; // movetext is done separately
			}

			// Create a new game if necessary
			if (game === null) {
				game = new Game();
			}

			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				var value = obj[key];

				if (node !== null) {
					exception.InvalidJSON(null, null, i18n.UNEXPECTED_JSON_FIELD);
				}
				processHeader(game, initialPositionFactory, key, value);
			}
		});
	}

	if (obj.MoveText === undefined) {
		return game; // there are no moves
	}

	var movetext = Buffer.from(obj.MoveText, 'base64');
	var pos = 0;
	while (pos < movetext.length) {
		// Create a new game if necessary
		if (game === null) {
			game = new Game();
		}

		// Matching anything else different from a header means that the move section
		// is going to be parse => set-up the root node.
		if (node === null) {
			initializeInitialPosition(game, initialPositionFactory);
			node = game.mainVariation();
			nodeIsVariation = true;
		}

		// Move type switch
		var moveType = movetext.readUInt16BE(pos);
		switch (moveType) {
			case EndMoveText:
				return game;
			case MoveNone:
				pos += MoveSize;
				break;
			case Extension:
				pos += MoveSize;
				var cmd = movetext.readUInt8(pos);
				pos++;
				var length = 0;
				switch (cmd) {
					case 0:
						break;
					case 1: // embedded audio
						length = movetext.readBigUInt64BE(pos);
						pos += 8 + length;
						break;
					case 2: // embedded video
						length = movetext.readBigUInt64BE(pos);
						pos += 8 + length;
						break;
					default:
						throw new exception.InvalidJSON(null, null, i18n.UNKNOWN_EXTENSION_FIELD);
				}
				break;
			case Result:
				pos += MoveSize;
				var result = movetext.readUInt8(pos);
				switch (result) {
					case WhiteWins:
						game.result('1-0');
						break;
					case BlackWins:
						game.result('0-1');
						break;
					case Draw:
						game.result('1/2-1/2');
						break;
					case Unknown:
						game.result('*');
						break;
				}
				pos += 1;
				break;
			case MoveNull:
				// create null move node
				node = node.play('--');
				pos += MoveSize;
				break;

			// NAG
			case Annotation:
				pos += MoveSize;
				node.addNag(movetext.readUInt8(pos));
				pos += 1;
				break;

			// Comment
			case LongTextComment:
			case TextComment:
				pos += MoveSize;
				var comment = '';
				var ch = movetext.readUInt8(pos);
				while (ch !== 0) {
					comment += String.fromCharCode(ch);
					pos++;
					ch = movetext.readUInt8(pos);
				}
				node.comment(comment, moveType === LongTextComment);
				pos++;
				break;

			case Tag:
				pos += MoveSize;
				var tag = '';
				var value = '';
				var ch = movetext.readUInt8(pos);
				while (ch !== 0) {
					tag += String.fromCharCode(ch);
					pos++;
					ch = movetext.readUInt8(pos);
				}
				pos++;
				ch = movetext.readUInt8(pos);
				while (ch !== 0) {
					value += String.fromCharCode(ch);
					pos++;
					ch = movetext.readUInt8(pos);
				}
				node.tag(tag, value);
				pos++;
				break;


			// Begin of variation
			case StartLongVariation:
			case StartVariation:
				// main variation already set node at the start
				if (nodeIsVariation) {
					throw new exception.InvalidJSON(null, null, i18n.UNEXPECTED_BEGIN_OF_VARIATION);
				}
				nodeStack.push(node);
				node = node.addVariation(moveType === StartLongVariation);
				nodeIsVariation = true;
				pos += MoveSize;
				break;

			// End of variation
			case EndVariation:
				if (nodeStack.length === 0) {
					throw new exception.InvalidJSON(null, null, i18n.UNEXPECTED_END_OF_VARIATION);
				}
				node = nodeStack.pop();
				nodeIsVariation = false;
				pos += MoveSize;
				break;

			default: // normal move
				try {
					var tOff = moveType & 0x3F;
					var toSq = bt.boardOffsetToSquare(tOff);
					var to = bt.squareToString(toSq);
					var fOff = (moveType >> 6) & 0x3F;
					var fromSq = bt.boardOffsetToSquare(fOff);
					var from = bt.squareToString(fromSq);
					var piece = (moveType >> 12) & 0x3;
					var flag = (moveType >> 14) & 0x3;
					var move = '';
					var position = nodeIsVariation ? node.initialPosition() : node.position();

					switch (flag) {
						case 0: // normal move
							var f = position.square(from);
							if (f !== '-') { // we are moving a piece/pawn (good!)
								if (f[1] !== 'p') { // it is a piece
									move += f[1].toUpperCase(); // KQBNR
									if (f[1] !== 'k') {
										move += from; // disambiguate the piece
									}
								}
							}
							var t = position.square(to);
							if (t !== '-') { // there is a piece/pawn here (capture!)
								// if the capturing entity is a pawn, we need to put in the file
								if (f[1] === 'p') {
									move += bt.boardOffsetToFile(fOff);
								}
								move += 'x' + to;
							} else { // square is empty
								move += to;
							}
							node = node.play(move);
							break;

						case 1: // promotion
							var f = position.square(from);
							if (f[1] !== 'p') { // ??
								throw new exception.InvalidJSON(null, null, i18n.ILLEGAL_PROMOTION);
							}
							var t = position.square(to);
							if (t !== '-') { // there is a piece/pawn here (capture!)
								move += bt.boardOffsetToFile(fOff);
								move += 'x' + to;
							} else { // square is empty
								move += to;
							}

							move += '=';

							switch (piece) {
								case 0:
									move += 'N';
									break;
								case 1:
									move += 'B';
									break;
								case 2:
									move += 'R';
									break;
								case 3:
									move += 'Q';
									break;
							}
							node = node.play(move);
							break;

						case 2: // en-passant
							move = bt.boardOffsetToFile(fOff) + 'x' + toSq;
							node = node.play(move);
							break;
						case 3: // castling
							if (to === 'c1' || to === 'c8') {
								move += 'O-O-O';
							} else {
								move += 'O-O';
							}
							node = node.play(move);
							break;
					}
					nodeIsVariation = false;
				}
				catch (error) {
					if (error instanceof exception.InvalidNotation) {
						throw new exception.InvalidJSON(null, null, i18n.INVALID_MOVE_IN_PGN_TEXT, error.notation, error.message);
					}
					else {
						throw error;
					}
				}
				pos += MoveSize;
				break;


		} // switch(moveType)
	} // while(pos < movetext.length)

	throw new exception.invalidJSON(null, null, i18n.UNEXPECTED_END_OF_TEXT);
}

function gameCountGetterImpl(impl) {
	return impl.games.length;
}


function gameGetterImpl(impl, gameIndex) {
	if (impl.currentGameIndex !== gameIndex) {
		impl.jsonArray = JSON.parse(impl.text);
	}
	impl.currentGameIndex = -1;
	var result = doParseGame(impl.jsonArray[gameIndex]);
	impl.currentGameIndex = gameIndex + 1;
	return result;
}

/**
* JSON parsing function.
*
* @param {string} jsonString String to parse.
* @returns {Database}
* @throws {module:exception.InvalidJSON}
*
*//**
*
* JSON parsing function.
*
* @param {string} jsonString String to parse.
* @param {number} gameIndex Only the game corresponding to this index is parsed.
* @returns {Game}
* @throws {module:exception.InvalidJSON}
*/
exports.jsonDecode = function (jsonString, gameIndex) {
	try {
		var obj = JSON.parse(jsonString);

		// Parse all games (and return a Database object)...
		if (arguments.length === 1) {
			if (obj instanceof Array) {
				var games = [];
				for (var i = 0; i < obj.length; i++) {
					games.push(i);
				}
				return new Database({ text: jsonString, games: games, currentGameIndex: -1, errors: [] }, gameCountGetterImpl, gameGetterImpl);
			} else {
				throw new exception.InvalidJSON(jsonString, jsonString.length, i18n.INVALID_JSON, gameIndex, obj.length);
			}
		}

		// Parse one game...
		else {
			if (!(obj instanceof Array) || obj.length < gameIndex) {
				throw new exception.InvalidJSON(jsonString, jsonString.length, i18n.INVALID_GAME_INDEX, gameIndex, obj.length);
			}
			return doParseGame(obj[gameIndex]);
		}
	} catch (err) {
		throw new exception.InvalidJSON(jsonString, 0, 'Invalid JSON');
	}
};