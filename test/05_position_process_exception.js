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


describe('getAttacks', function() {

	function testGetAttacks(fen, byWho, squares) {
		var position = new kokopu.Position(fen);
		for(var sq in squares) {
			var attacks = position.getAttacks(sq, byWho).sort().join('/');
			test.value(attacks).is(squares[sq]);
		}
	}

	it('Single attack', function() { testGetAttacks('8/8/8/4Q3/8/8/8/8 w - - 0 1', 'w', { c3: 'e5', d2: '' }); });
	it('Double attacks', function() { testGetAttacks('8/8/8/4r3/8/1q6/8/8 w - - 0 1', 'b', { c7: '', e1: 'e5', e6: 'b3/e5', g8: 'b3' }); });
	it('Multiple attacks 1', function() { testGetAttacks('8/8/5B2/1B6/3RN3/8/8/8 w - - 0 1', 'w',
		{ c3: 'e4', d2: 'd4/e4', d4: 'f6', d7: 'b5/d4', d8: 'd4/f6', g4: '', g5: 'e4/f6' }); });
	it('Multiple attacks 2', function() { testGetAttacks('1r2r2k/1bq3bp/p2p2n1/1p1P1Qp1/4B3/PP2R3/1BP3PP/5R1K w - - 0 1', 'w',
		{ a8: '', b4: 'a3', e5: 'b2/f5', f3: 'e3/e4/f1/f5/g2', g2: 'e4/h1' }); });
	it('Multiple attacks 3', function() { testGetAttacks('1r2r2k/1bq3bp/p2p2n1/1p1P1Qp1/4B3/PP2R3/1BP3PP/5R1K w - - 0 1', 'b',
		{ a8: 'b7/b8', b4: '', e5: 'd6/e8/g6/g7', f3: '', g2: '' }); });

	it('Invalid square 1', function() { testInvalidArgument(function(position) { return position.getAttacks('m7', 'w'); }); });
	it('Invalid square 2', function() { testInvalidArgument(function(position) { return position.getAttacks('dfsdf', 'w'); }); });
	it('Invalid color 1', function() { testInvalidArgument(function(position) { return position.getAttacks('e3', 'W'); }); });
	it('Invalid color 2', function() { testInvalidArgument(function(position) { return position.getAttacks('e3', 'n'); }); });
});


describe('kingSquare', function() {
	it('Invalid color 1', function() { testInvalidArgument(function(position) { return position.kingSquare('B'); }); });
	it('Invalid color 2', function() { testInvalidArgument(function(position) { return position.kingSquare('whatever'); }); });
});


describe('Move legality check', function() {

	it('Invalid square from', function() { testInvalidArgument(function(position) { return position.isMoveLegal('c0', 'e4'); }); });
	it('Invalid square to', function() { testInvalidArgument(function(position) { return position.isMoveLegal('b3', 'A2'); }); });

	function testValidMove(fen, from, to, expectedSignature) {
		var position = new kokopu.Position(fen);
		var md = position.isMoveLegal(from, to);
		test.value(md).isFunction().hasProperty('status', 'regular');
		test.value(md().toString()).is(expectedSignature);
	}

	it('Regular move', function() { testValidMove('start', 'e2', 'e4', 'e2e4'); });
	it('Castling move', function() { testValidMove('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1', 'g1', 'e1g1O'); });
	it('Castling move (Chess960)', function() { testValidMove('chess960:r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', 'e8', 'h8', 'e8g8O'); });

	function testInvalidMove(fen, from, to) {
		var position = new kokopu.Position(fen);
		var md = position.isMoveLegal(from, to);
		test.value(md).is(false);
	}

	it('KxR at regular chess', function() { testInvalidMove('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', 'e8', 'h8'); });
	it('Non-KxR at Chess960', function() { testInvalidMove('chess960:r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1', 'g1'); });

	function testInvalidPromotionPiece(fen, from, to, promo) {
		var position = new kokopu.Position(fen);
		var md = position.isMoveLegal(from, to);
		test.value(md).isFunction().hasProperty('status', 'promotion');
		test.exception(function() { md(promo); }).isInstanceOf(kokopu.exception.IllegalArgument);
	}

	it('Invalid promotion piece 1', function() { testInvalidPromotionPiece('8/4K3/8/8/8/8/6pk/8 b - - 0 1', 'g2', 'g1', 'whatever'); });
	it('Invalid promotion piece 2', function() { testInvalidPromotionPiece('8/4K3/8/8/8/8/p6k/8 b - - 0 1', 'a2', 'a1', 'k'); });
	it('Invalid promotion piece 3', function() { testInvalidPromotionPiece('8/4K3/8/8/8/8/p6k/8 b - - 0 1', 'a2', 'a1', 'p'); });
});


describe('Parse degenerated notation ', function() {

	function testDegeneratedNotation(fen, move, expected) {
		var position = new kokopu.Position(fen);
		var md = position.notation(move);
		test.value(md.toString()).is(expected);
	}

	it('King-side castling move with zero characters', function() { testDegeneratedNotation('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', '0-0', 'e1g1O'); });
	it('Queen-side castling move with zero characters', function() { testDegeneratedNotation('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', '0-0-0', 'e8c8O'); });
});
