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
	it('a1', function() { test.value(RPBChess.squareColor('a1')).is('b'); });
	it('h1', function() { test.value(RPBChess.squareColor('h1')).is('w'); });
	it('a8', function() { test.value(RPBChess.squareColor('a8')).is('w'); });
	it('h8', function() { test.value(RPBChess.squareColor('h8')).is('b'); });
	it('b3', function() { test.value(RPBChess.squareColor('b3')).is('w'); });
	it('b4', function() { test.value(RPBChess.squareColor('b4')).is('b'); });
	it('c4', function() { test.value(RPBChess.squareColor('c4')).is('w'); });
	it('f5', function() { test.value(RPBChess.squareColor('f5')).is('w'); });
	it('e5', function() { test.value(RPBChess.squareColor('e5')).is('b'); });
	it('e6', function() { test.value(RPBChess.squareColor('e6')).is('w'); });
});
