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


function testInvalidArgument(action) {
	var position = new kokopu.Position();
	test.exception(function() { action(position); }).isInstanceOf(kokopu.exception.IllegalArgument);
}


describe('isAttacked', function() {

	function testIsAttacked(fen, byWho, attackedSquares) {
		var position = new kokopu.Position(fen);
		var res = '';
		kokopu.forEachSquare(function(square) {
			if(position.isAttacked(square, byWho)) {
				if(res !== '') { res += '/'; }
				res += square;
			}
		});
		test.value(res).is(attackedSquares);
	}

	it('King attacks'      , function() { testIsAttacked('8/8/8/4K3/8/8/8/8 w - - 0 1', 'w', 'd4/e4/f4/d5/f5/d6/e6/f6'); });
	it('Queen attacks'     , function() { testIsAttacked('8/8/8/4q3/8/8/8/8 w - - 0 1', 'b', 'a1/e1/b2/e2/h2/c3/e3/g3/d4/e4/f4/a5/b5/c5/d5/f5/g5/h5/d6/e6/f6/c7/e7/g7/b8/e8/h8'); });
	it('Rook attacks'      , function() { testIsAttacked('8/8/8/4R3/8/8/8/8 w - - 0 1', 'w', 'e1/e2/e3/e4/a5/b5/c5/d5/f5/g5/h5/e6/e7/e8'); });
	it('Bishop attacks'    , function() { testIsAttacked('8/8/8/4b3/8/8/8/8 w - - 0 1', 'b', 'a1/b2/h2/c3/g3/d4/f4/d6/f6/c7/g7/b8/h8'); });
	it('Knight attacks'    , function() { testIsAttacked('8/8/8/4N3/8/8/8/8 w - - 0 1', 'w', 'd3/f3/c4/g4/c6/g6/d7/f7'); });
	it('White pawn attacks', function() { testIsAttacked('8/8/8/4P3/8/8/8/8 w - - 0 1', 'w', 'd6/f6'); });
	it('Black pawn attacks', function() { testIsAttacked('8/8/8/4p3/8/8/8/8 w - - 0 1', 'b', 'd4/f4'); });

	it('Invalid square 1', function() { testInvalidArgument(function(position) { return position.isAttacked('b9', 'w'); }); });
	it('Invalid square 2', function() { testInvalidArgument(function(position) { return position.isAttacked('k1', 'w'); }); });
	it('Invalid square 3', function() { testInvalidArgument(function(position) { return position.isAttacked('', 'w'); }); });
	it('Invalid color 1', function() { testInvalidArgument(function(position) { return position.isAttacked('e3', 'z'); }); });
	it('Invalid color 2', function() { testInvalidArgument(function(position) { return position.isAttacked('e3', ''); }); });
});


describe('kingSquare', function() {
	it('Invalid color 1', function() { testInvalidArgument(function(position) { return position.kingSquare('B'); }); });
	it('Invalid color 2', function() { testInvalidArgument(function(position) { return position.kingSquare('whatever'); }); });
});


describe('Move legality check', function() {
	it('Invalid square from', function() { testInvalidArgument(function(position) { return position.isMoveLegal('c0', 'e4'); }); });
	it('Invalid square to', function() { testInvalidArgument(function(position) { return position.isMoveLegal('b3', 'A2'); }); });
});
