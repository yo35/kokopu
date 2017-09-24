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

describe('Square color', function() {

	var RANK = '12345678';
	var FILE = 'abcdefgh';

	it('Valid inputs', function() {
		for(var r=0; r<8; ++r) {
			for(var f=0; f<8; ++f) {
				var expected = f%2 === r%2 ? 'b' : 'w';
				var square = FILE[f] + RANK[r];
				test.value(RPBChess.squareColor(square)).is(expected);
			}
		}
	});

	['e9', 'i5'].forEach(function(elem) {
		it('Error with ' + elem, function() {
			test.exception(function() { RPBChess.squareColor(elem); }).isInstanceOf(RPBChess.exception.IllegalArgument);
		});
	});

});
