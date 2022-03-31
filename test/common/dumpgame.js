/******************************************************************************
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
 ******************************************************************************/


'use strict';


var kokopu = require('../../src/index');


/**
 * Dump the content of a Game object.
 *
 * @param {Game} game
 * @param {string} [iterationStyle='using next'] Either `'using next'` or `'using nodes'`
 * @returns {string}
 */
module.exports = function(game, iterationStyle) {
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
		if (iterationStyle === undefined || iterationStyle === 'using next') {
			var node = variation.first();
			while (node !== undefined) {
				dumpNode(node, indent);
				node = node.next();
			}
		}
		else if (iterationStyle === 'using nodes') {
			variation.nodes().forEach(function(nodeInArray) {
				dumpNode(nodeInArray, indent);
			});
		}
		else {
			throw 'Unexpected iteration style: ' + iterationStyle; // eslint-disable-line no-throw-literal
		}
	}

	dumpHeader('White', game.playerName('w'));
	dumpHeader('WhiteElo', game.playerElo('w'));
	dumpHeader('WhiteTitle', game.playerTitle('w'));
	dumpHeader('Black', game.playerName('b'));
	dumpHeader('BlackElo', game.playerElo('b'));
	dumpHeader('BlackTitle', game.playerTitle('b'));
	dumpHeader('Event', game.event());
	dumpHeader('Round', game.round());
	dumpHeader('Site', game.site());
	dumpHeader('Date', game.date());
	dumpHeader('Annotator', game.annotator());
	dumpVariant(game.variant());
	dumpInitialPosition(game.initialPosition());
	dumpVariation(game.mainVariation(), '', '');
	dumpResult(game.result());

	return res;
};
