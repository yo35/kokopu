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
			gameCount: fields[1],
			pgn: readText('games/' + fields[0] + '.pgn')
		};
	});
}


describe('Game count', function() {
	testData().forEach(function(elem) {
		it('Game ' + elem.label, function() {
			test.value(RPBChess.pgnRead(elem.pgn).length, elem.gameCount);
		});
	});
});
