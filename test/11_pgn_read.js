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


var kokopu = require('../src/index');
var readCSV = require('./common/readcsv');
var readText = require('./common/readtext');
var resourceExists = require('./common/resourceExists');
var test = require('unit.js');


function testData() {
	return readCSV('pgns.csv', function(fields) {
		return {
			label: fields[0],
			gameCount: parseInt(fields[1]),
			pgn: readText('pgns/' + fields[0] + '.pgn')
		};
	});
}


/**
 * Return whether the PGN item corresponding to the given index in the PGN file corresponding to the given name is expected to be parsed
 * as a valid PGN item, or is expected to throw an exception on a parsing attempt.
 *
 * @param {string} pgnName Name of the PGN file (without the .pgn extension)
 * @param {number} gameIndex Index of the item within the PGN file.
 * @returns {string} `'log'` if the PGN item is valid, `'err'` if an exception is expected to be thrown on parsing.
 */
function getItemType(pgnName, gameIndex) {
	var fileBasename = 'pgns/' + pgnName + '/' + gameIndex;
	var logExist = resourceExists(fileBasename + '.log');
	var errExist = resourceExists(fileBasename + '.err');
	if(logExist && errExist) {
		throw 'Both .log not .err defined for ' + fileBasename; // eslint-disable-line no-throw-literal
	}
	else if(logExist) {
		return 'log';
	}
	else if(errExist) {
		return 'err';
	}
	else {
		throw 'Neither .log not .err defined for ' + fileBasename; // eslint-disable-line no-throw-literal
	}
}


/**
 * Load the descriptor corresponding to a valid PGN item.
 *
 * @param {string} pgnName Name of the PGN file (without the .pgn extension)
 * @param {number} gameIndex Index of the item within the PGN file.
 * @returns {string}
 */
function loadValidItemDescriptor(pgnName, gameIndex) {
	var filename = 'pgns/' + pgnName + '/' + gameIndex + '.log';
	return readText(filename).trim();
}


/**
 * Load the descriptor corresponding to an invalid PGN item.
 *
 * @param {string} pgnName Name of the PGN file (without the .pgn extension)
 * @param {number} gameIndex Index of the item within the PGN file.
 * @returns {{index:number, lineNumber:number, message:string}}
 */
function loadErrorItemDescriptor(pgnName, gameIndex) {
	var filename = 'pgns/' + pgnName + '/' + gameIndex + '.err';
	var fields = readText(filename).split('\n');
	return { index: parseInt(fields[0]), lineNumber: parseInt(fields[1]), message: fields[2].trim() };
}


describe('Read PGN - Game count', function() {
	testData().forEach(function(elem) {
		it('File ' + elem.label, function() {
			test.value(kokopu.pgnRead(elem.pgn).gameCount()).is(elem.gameCount);
		});
	});
});


/**
 * Dump the content of a Game object read from a `.pgn` file.
 *
 * @param {Game} game
 * @param {string} iterationStyle Either `'using-next'` or `'using-nodes'`
 * @returns {string}
 */
function dumpGame(game, iterationStyle) {
	var res = '\n';

	function dumpHeader(key, value) {
		if(value === undefined) { return; }

		res += key + ' = {';
		if(value instanceof Date) {
			res += value.toDateString();
		}
		else if(typeof value === 'object') {

			// Extract the subkeys of the object `value`.
			var subkeys = [];
			for(var subkey in value) {
				subkeys.push(subkey);
			}
			subkeys.sort();

			// Print the value of each subkey.
			if(subkeys.length === 0) {
				res += '{}';
			}
			else {
				res += '{ ';
				for(var i=0; i<subkeys.length; ++i) {
					if(i !== 0) { res += ', '; }
					res += subkeys[i] + ':' + value[subkeys[i]];
				}
				res += ' }';
			}
		}
		else {
			res += value;
		}
		res += '}\n';
	}

	function dumpResult(result) {
		res += '{';
		switch(result) {
			case '1-0': res += 'White wins'; break;
			case '0-1': res += 'Black wins'; break;
			case '1/2-1/2': res += 'Draw'; break;
			case '*': res += 'Line'; break;
			default: break;
		}
		res += '}\n';
	}

	function dumpVariant(variant) {
		if(variant !== 'regular') {
			res += 'Variant = {' + variant + '}\n';
		}
	}

	function dumpInitialPosition(position) {
		if(position.fen() !== new kokopu.Position().fen()) {
			res += position.ascii() + '\n';
		}
	}

	function dumpNags(node) {
		var nags = node.nags();
		for(var k=0; k<nags.length; ++k) {
			res += ' $' + nags[k];
		}
	}

	function dumpTags(node) {
		var tags = node.tags();
		for(var k=0; k<tags.length; ++k) {
			var key = tags[k];
			res += ' [' + key + ' = {' + node.tag(key) + '}]';
		}
	}

	function dumpComment(node) {
		var comment = node.comment();
		if(comment !== undefined) {
			res += ' {' + node.comment() + '}';
			if(node.isLongComment()) {
				res += '<LONG';
			}
		}
	}

	function dumpNode(node, indent) {

		// Describe the move
		res += indent + '(' + node.fullMoveNumber() + node.moveColor() + ') ' + node.notation();
		dumpNags(node);
		dumpTags(node);
		dumpComment(node);
		res += '\n';

		// Print the sub-variations
		var subVariations = node.variations();
		for(var k=0; k<subVariations.length; ++k) {
			res += indent + ' |\n';
			dumpVariation(subVariations[k], indent + ' |  ', indent + ' +--');
		}
		if(subVariations.length > 0) {
			res += indent + ' |\n';
		}
	}

	// Recursive function to dump a variation.
	function dumpVariation(variation, indent, indentFirst) {

		// Variation header
		res += indentFirst + '-+';
		if(variation.isLongVariation()) {
			res += '<LONG';
		}
		dumpNags(variation);
		dumpTags(variation);
		dumpComment(variation);
		res += '\n';

		// List of moves
		if(iterationStyle === 'using-next') {
			var node = variation.first();
			while(node !== undefined) {
				dumpNode(node, indent);
				node = node.next();
			}
		}
		else if(iterationStyle === 'using-nodes') {
			variation.nodes().forEach(function(nodeInArray) {
				dumpNode(nodeInArray, indent);
			});
		}
	}

	dumpHeader('White'     , game.playerName ('w'));
	dumpHeader('WhiteElo'  , game.playerElo  ('w'));
	dumpHeader('WhiteTitle', game.playerTitle('w'));
	dumpHeader('Black'     , game.playerName ('b'));
	dumpHeader('BlackElo'  , game.playerElo  ('b'));
	dumpHeader('BlackTitle', game.playerTitle('b'));
	dumpHeader('Event'     , game.event    ());
	dumpHeader('Round'     , game.round    ());
	dumpHeader('Site'      , game.site     ());
	dumpHeader('Date'      , game.date     ());
	dumpHeader('Annotator' , game.annotator());
	dumpVariant(game.variant());
	dumpInitialPosition(game.initialPosition());
	dumpVariation(game.mainVariation(), '', '');
	dumpResult(game.result());

	return res;
}


function pgnItemChecker(pgnName, gameIndex, iterationStyle, loader) {
	return function() {

		// LOG type => ensure that the item is valid, and compare its dump result to the descriptor.
		if(getItemType(pgnName, gameIndex) === 'log') {
			var expectedDescriptor = loadValidItemDescriptor(pgnName, gameIndex);
			test.value(dumpGame(loader(gameIndex), iterationStyle).trim()).is(expectedDescriptor);
		}

		// ERR type => ensure that an exception is thrown, and check its attributes.
		else {
			var expectedDescriptor = loadErrorItemDescriptor(pgnName, gameIndex);
			test.exception(function() { loader(gameIndex); })
				.isInstanceOf(kokopu.exception.InvalidPGN)
				.hasProperty('index', expectedDescriptor.index)
				.hasProperty('lineNumber', expectedDescriptor.lineNumber)
				.hasProperty('message', expectedDescriptor.message);
		}
	};
}


describe('Read PGN - Game content (direct access)', function() {
	testData().forEach(function(elem) {
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			it('File ' + elem.label + ' - Game ' + gameIndex, pgnItemChecker(elem.label, gameIndex, 'using-next', function(i) {
				return kokopu.pgnRead(elem.pgn, i);
			}));
		}
	});
});


function DatabaseHolder(pgn) {
	this._pgn = pgn;
}


DatabaseHolder.prototype.database = function() {
	if(!(this._database)) {
		this._database = kokopu.pgnRead(this._pgn);
	}
	return this._database;
};


describe('Read PGN - Game content (database)', function() {
	testData().forEach(function(elem) {
		var holder = new DatabaseHolder(elem.pgn);
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			if(gameIndex % 3 === 2) { continue; }
			it('File ' + elem.label + ' - Game ' + gameIndex, pgnItemChecker(elem.label, gameIndex, 'using-nodes', function(i) {
				return holder.database().game(i);
			}));
		}
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			if(gameIndex % 3 !== 2) { continue; }
			it('File ' + elem.label + ' - Game ' + gameIndex, pgnItemChecker(elem.label, gameIndex, 'using-nodes', function(i) {
				return holder.database().game(i);
			}));
		}
	});
});
