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
var test = require('unit.js');


var NODE_COUNT_MAX_MAX = 10000000; // -1 for "no limit"
var SPEED_MIN = 100; // kN/s
var FIXED_TIMOUT = 100; // ms



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


function testData() {
	return readCSV('performance.csv', function(fields) {
		return {
			fen: fields[0],
			nodes: fields.slice(1)
		};
	});
}


describe('Recursive move generation', function() {
	testData().forEach(function(elem) {
		var initialPos = new kokopu.Position(elem.fen);
		elem.nodes.forEach(function(expectedNodeCount, depth) {
			if(NODE_COUNT_MAX_MAX >= 0 && expectedNodeCount <= NODE_COUNT_MAX_MAX) {
				it('From ' + elem.fen + ' up to depth ' + depth, function() {
					test.value(generateSuccessors(initialPos, depth), expectedNodeCount);
				}).timeout(FIXED_TIMOUT + expectedNodeCount / SPEED_MIN);
			}
		});
	});
});
