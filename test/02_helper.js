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
var test = require('unit.js');


describe('Square color', function() {
	it('a1', function() { test.value(kokopu.squareColor('a1')).is('b'); });
	it('h1', function() { test.value(kokopu.squareColor('h1')).is('w'); });
	it('a8', function() { test.value(kokopu.squareColor('a8')).is('w'); });
	it('h8', function() { test.value(kokopu.squareColor('h8')).is('b'); });
	it('b3', function() { test.value(kokopu.squareColor('b3')).is('w'); });
	it('b4', function() { test.value(kokopu.squareColor('b4')).is('b'); });
	it('c4', function() { test.value(kokopu.squareColor('c4')).is('w'); });
	it('f5', function() { test.value(kokopu.squareColor('f5')).is('w'); });
	it('e5', function() { test.value(kokopu.squareColor('e5')).is('b'); });
	it('e6', function() { test.value(kokopu.squareColor('e6')).is('w'); });

	it('Error with 7', function() { test.exception(function() { kokopu.squareColor('7'); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Error with b8g', function() { test.exception(function() { kokopu.squareColor('b8g'); }).isInstanceOf(kokopu.exception.IllegalArgument); });
});


describe('Square to coordinates', function() {
	it('a1', function() { test.value(kokopu.squareToCoordinates('a1')).is({ file:0, rank:0 }); });
	it('h1', function() { test.value(kokopu.squareToCoordinates('h1')).is({ file:7, rank:0 }); });
	it('a8', function() { test.value(kokopu.squareToCoordinates('a8')).is({ file:0, rank:7 }); });
	it('h8', function() { test.value(kokopu.squareToCoordinates('h8')).is({ file:7, rank:7 }); });
	it('e3', function() { test.value(kokopu.squareToCoordinates('e3')).is({ file:4, rank:2 }); });

	it('Error with <empty string>', function() { test.exception(function() { kokopu.squareToCoordinates(''); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Error with cc', function() { test.exception(function() { kokopu.squareToCoordinates('cc'); }).isInstanceOf(kokopu.exception.IllegalArgument); });
});


describe('Coordinates to square', function() {
	it('a1', function() { test.value(kokopu.coordinatesToSquare(0, 0)).is('a1'); });
	it('h1', function() { test.value(kokopu.coordinatesToSquare(7, 0)).is('h1'); });
	it('a8', function() { test.value(kokopu.coordinatesToSquare(0, 7)).is('a8'); });
	it('h8', function() { test.value(kokopu.coordinatesToSquare(7, 7)).is('h8'); });
	it('e3', function() { test.value(kokopu.coordinatesToSquare(4, 2)).is('e3'); });

	it('Error with (-1,4)', function() { test.exception(function() { kokopu.coordinatesToSquare(-1, 4); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Error with (8,3)', function() { test.exception(function() { kokopu.coordinatesToSquare(8, 3); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Error with (5,-1)', function() { test.exception(function() { kokopu.coordinatesToSquare(5, -1); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Error with (5,8)', function() { test.exception(function() { kokopu.coordinatesToSquare(7, 8); }).isInstanceOf(kokopu.exception.IllegalArgument); });
});


describe('Opposite color', function() {
	it('white to black', function() { test.value(kokopu.oppositeColor('w')).is('b'); });
	it('black to white', function() { test.value(kokopu.oppositeColor('b')).is('w'); });

	it('Error with z', function() { test.exception(function() { kokopu.oppositeColor('z'); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Error with bb', function() { test.exception(function() { kokopu.oppositeColor('bb'); }).isInstanceOf(kokopu.exception.IllegalArgument); });
});


describe('Variant with canonical start position', function() {
	it('no-king', function() { test.value(kokopu.variantWithCanonicalStartPosition('no-king')).is(false); });
	it('chess960', function() { test.value(kokopu.variantWithCanonicalStartPosition('chess960')).is(false); });
	it('antichess', function() { test.value(kokopu.variantWithCanonicalStartPosition('antichess')).is(true); });

	it('Error with invalid variant', function() {
		test.exception(function() { kokopu.variantWithCanonicalStartPosition('whatever'); }).isInstanceOf(kokopu.exception.IllegalArgument);
	});
});
