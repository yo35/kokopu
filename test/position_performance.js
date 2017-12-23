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
var test = require('unit.js');
var fs = require('fs');


/**
 * Generate recursively the successors of the given position, up to the given depth.
 */
function generateSuccessors(pos, depth) {
	var result = 1;

	if(depth > 0) {
		pos.moves().forEach(function(move) {
			var nextPos = new RPBChess.Position(pos);
			nextPos.play(move);
			result += generateSuccessors(nextPos, depth-1);
		});
	}

	return result;
}


/**
 * Measure the performance of the move generation procedure, starting from the given position,
 * and up to the given depth.
 */
exports.run = function(fen, minDepth, maxDepth, verbose) {

	var initialPos = new RPBChess.Position(fen);

	function runAtDepth(depth) {
	
		var startAt = Date.now();
		var nodes = generateSuccessors(initialPos, depth);
		var stopAt = Date.now();
	
		var duration = stopAt - startAt;
		var speed = nodes / duration;
		var sep = '     ';
		console.log(
			'Depth: ' + depth + sep +
			'Nodes: ' + nodes + sep +
			'Duration: ' + duration + ' ms' + sep +
			'Speed: ' + speed.toFixed(1) + ' kN/s');
	}

	console.log('Initial position is: ' + initialPos.fen());
	if(verbose) {
		console.log(initialPos.ascii());
	}
	console.log('Starting generation up to depth ' + maxDepth);

	for(var depth=minDepth; depth<=maxDepth; ++depth) {
		runAtDepth(depth);
	}
};


function testData() {
	var result = [];
	var lines = fs.readFileSync('./test/performance.csv', 'utf8').split('\n');
	var depthMax = 4;
	lines.forEach(function(elem, index) {

		// Skip header and empty lines.
		if(elem === '' || index === 0) {
			return;
		}

		var field = elem.split('\t');
		result.push({
			fen: field[0],
			nodes: field.slice(1, depthMax + 2)
		});

	});
	return result;
}


describe('Recursive move generation', function() {
	testData().forEach(function(elem) {
		var initialPos = new RPBChess.Position(elem.fen);
		elem.nodes.forEach(function(expectedNodeCount, depth) {
			it('From ' + elem.fen + ' up to depth ' + depth, function() {
				test.value(generateSuccessors(initialPos, depth), expectedNodeCount);
			});
		});
	});
});
