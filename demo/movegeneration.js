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
var program = require('commander');


function align(data, width) {
	var result = String(data);
	while(result.length < width) {
		result = ' ' + result;
	}
	return result;
}


/**
 * Generate recursively the successors of the given position, up to the given depth.
 */
function generateSuccessors(pos, depth) {
	var result = 1;

	if(depth > 0) {
		pos.moves().forEach(function(move) {
			var nextPos = new kokopu.Position(pos);
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
function run(fen, minDepth, maxDepth, verbose) {

	var initialPos = new kokopu.Position(fen);
	function runAtDepth(depth) {

		var startAt = Date.now();
		var nodes = generateSuccessors(initialPos, depth);
		var stopAt = Date.now();

		var duration = stopAt - startAt;
		var speed = nodes / duration;
		var sep = '     ';
		console.log(
			'Depth: ' + align(depth, 2) + sep +
			'Nodes: ' + align(nodes, 10) + sep +
			'Duration: ' + align(duration, 8) + ' ms' + sep +
			'Speed: ' + align(Number.isFinite(speed) ? speed.toFixed(1) : '--', 7) + ' kN/s');
	}

	console.log('Initial position is: ' + initialPos.fen());
	if(verbose) {
		console.log(initialPos.ascii());
	}
	console.log('Starting generation up to depth ' + maxDepth);

	for(var depth=minDepth; depth<=maxDepth; ++depth) {
		runAtDepth(depth);
	}
}



// -----------------------------------------------------------------------------
// Command line parsing
// -----------------------------------------------------------------------------

program
	.description('Recursive generation of chess moves, starting from a given position')
	.option('-P, --position <fen>', 'initial position', 'start')
	.option('-D, --depth <depth>', 'maximum depth to visit', 5)
	.option('-v, --verbose', 'increase the verbosity level')
	.parse(process.argv);

var opts = program.opts();
run(opts.position, 0, parseInt(opts.depth), Boolean(opts.verbose));
