/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chess, a JavaScript chess library.             *
 *    Copyright (C) 2017  Yoann Le Montagner <yo35 -at- melix.net>            *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


'use strict';


var RPBChess = require('../src/core.js');
var readCSV = require('./common/readcsv');
var readText = require('./common/readtext');
var test = require('unit.js');


function testData() {
	return readCSV('games.csv', function(fields) {
		return {
			label: fields[0],
			gameCount: parseInt(fields[1]),
			pgn: readText('games/' + fields[0] + '.pgn')
		};
	});
}


describe('Game count', function() {
	testData().forEach(function(elem) {
		it('File ' + elem.label, function() {
			test.value(RPBChess.pgnRead(elem.pgn).length).is(elem.gameCount);
		});
	});
});


/**
 * Dump the content of a Game object read from a `.pgn` file.
 *
 * @param {Game} game
 * @returns {string}
 */
function dumpGame(game) {
	var res = '\n';

	// TODO // Dump the headers.
	// var headers = game.headers();
	// headers.sort();
	// for(var k=0; k<headers.length; ++k) {
	// 	var key = headers[k];
	// 	res += key + ' = {' + pgnItem.header(key) + '}\n';
	// }

	// Helper function to dump the nags in an order that does not depend on the parsing order.
	function dumpNags(nags) {
		nags.sort();
		for(var k=0; k<nags.length; ++k) {
			res += ' $' + nags[k];
		}
	}

	// Helper function to dump the tags in an order that does not depend on the parsing order.
	function dumpTags(node) {
		var tags = node.tags();
		tags.sort();
		for(var k=0; k<tags.length; ++k) {
			var key = tags[k];
			res += ' [' + key + ' = {' + node.tag(key) + '}]';
		}
	}

	// Recursive function to dump a variation.
	function dumpVariation(variation, indent, indentFirst) {

		// Variation header
		res += indentFirst + '-+';
		if(variation.isLongVariation()) {
			res += '<LONG';
		}
		dumpNags(variation.nags());
		dumpTags(variation);
		if(variation.comment() !== null) {
			res += ' {' + variation.comment() + '}';
			if(variation.isLongComment()) {
				res += '<LONG';
			}
		}
		res += '\n';

		// List of moves
		var node = variation.first();
		while(node !== undefined) {

			// Describe the move
			res += indent + '(' + node.fullMoveNumber() + node.moveColor() + ') ' + node.move();
			dumpNags(node.nags());
			dumpTags(node);
			if(node.comment() !== null) {
				res += ' {' + node.comment() + '}';
				if(node.isLongComment()) {
					res += '<LONG';
				}
			}
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

			// Go to the next move
			node = node.next();
		}
	}

	// Dump the moves and the result.
	dumpVariation(game.mainVariation(), '', '');
	res += '{' + game.result() + '}\n';

	return res;
}


function checkGameContent(testDataDescriptor, gameIndex) {
	it('File ' + testDataDescriptor.label + ' - Game ' + gameIndex, function() {
		var expectedDump = readText('games/' + testDataDescriptor.label + '_' + gameIndex + '.log');
		test.value(dumpGame(RPBChess.pgnRead(testDataDescriptor.pgn, gameIndex)).trim()).is(expectedDump.trim());
	});
}


describe('Game content', function() {
	testData().forEach(function(elem) {
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			checkGameContent(elem, gameIndex);
		}
	});
});
