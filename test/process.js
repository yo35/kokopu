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


function testData() {
	var result = [];
	var lines = fs.readFileSync('./test/positions.csv', 'utf8').split('\n');
	lines.forEach(function(elem, index) {
		
		// Skip header and empty lines.
		if(elem === '' || index === 0) {
			return;
		}
		
		var field = elem.split('\t');
		result.push({
			label      : field[0],
			constructor: field[1],
			fen        : field[2],
			isLegal    : field[3]==="true",
			whiteKing  : field[4],
			blackKing  : field[5],
			isCheck    : field[6]==="true",
			isCheckmate: field[7]==="true",
			isStalemate: field[8]==="true",
			hasMove    : field[9]==="true"
		});
		
	});
	return result;
}


function createPosition(testDataDescriptor) {
	return new RPBChess.Position(testDataDescriptor.constructor==='fen' ? testDataDescriptor.fen : testDataDescriptor.constructor);
}


describe('isAttacked', function() {
	
	var ROW    = '12345678';
	var COLUMN = 'abcdefgh';
	
	function testIsAttacked(fen, byWho, attackedSquares) {
		var position = new RPBChess.Position(fen);
		var res = '';
		for(var r=0; r<8; ++r) {
			for(var c=0; c<8; ++c) {
				var square = COLUMN[c] + ROW[r];
				if(position.isAttacked(square, byWho)) {
					if(res !== '') { res += '/'; }
					res += square;
				}
			}
		}
		test.value(res).is(attackedSquares);
	}
	
	it('King attacks'      , function() { testIsAttacked('8/8/8/4K3/8/8/8/8 w - - 0 1', 'w', 'd4/e4/f4/d5/f5/d6/e6/f6'); });
	it('Queen attacks'     , function() { testIsAttacked('8/8/8/4q3/8/8/8/8 w - - 0 1', 'b', 'a1/e1/b2/e2/h2/c3/e3/g3/d4/e4/f4/a5/b5/c5/d5/f5/g5/h5/d6/e6/f6/c7/e7/g7/b8/e8/h8'); });
	it('Rook attacks'      , function() { testIsAttacked('8/8/8/4R3/8/8/8/8 w - - 0 1', 'w', 'e1/e2/e3/e4/a5/b5/c5/d5/f5/g5/h5/e6/e7/e8'); });
	it('Bishop attacks'    , function() { testIsAttacked('8/8/8/4b3/8/8/8/8 w - - 0 1', 'b', 'a1/b2/h2/c3/g3/d4/f4/d6/f6/c7/g7/b8/h8'); });
	it('Knight attacks'    , function() { testIsAttacked('8/8/8/4N3/8/8/8/8 w - - 0 1', 'w', 'd3/f3/c4/g4/c6/g6/d7/f7'); });
	it('White pawn attacks', function() { testIsAttacked('8/8/8/4P3/8/8/8/8 w - - 0 1', 'w', 'd6/f6'); });
	it('Black pawn attacks', function() { testIsAttacked('8/8/8/4p3/8/8/8/8 w - - 0 1', 'b', 'd4/f4'); });
	
});


describe('Legality check & king squares', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var pos = createPosition(elem);
			test.value(pos.isLegal()).is(elem.isLegal);
			test.value(pos.kingSquare('w')).is(elem.whiteKing);
			test.value(pos.kingSquare('b')).is(elem.blackKing);
		});
	});
});


describe('Check / checkmate / stalemate', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var pos = createPosition(elem);
			test.value(pos.isCheck()).is(elem.isCheck);
			test.value(pos.isCheckmate()).is(elem.isCheckmate);
			test.value(pos.isStalemate()).is(elem.isStalemate);
			test.value(pos.hasMove()).is(elem.hasMove);
		});
	});
});
