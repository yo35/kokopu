/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018  Yoann Le Montagner <yo35 -at- melix.net>            *
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


var kokopu = require('../index');
var test = require('unit.js');


describe('Constructor', function() {

	var startFEN   = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	var emptyFEN   = '8/8/8/8/8/8/8/8 w - - 0 1';
	var customFEN1 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 10 5';
	var customFEN2 = 'k7/n1PB4/1K6/8/8/8/8/8 w - - 0 60';

	var optsFEN1 = { fiftyMoveClock: 10, fullMoveNumber: 5 };
	var optsFEN2 = { fullMoveNumber: 60 };

	it('Default constructor'    , function() { test.value(new kokopu.Position().fen()).is(startFEN); });
	it('Constructor \'start\''  , function() { test.value(new kokopu.Position('start').fen()).is(startFEN); });
	it('Constructor \'empty\''  , function() { test.value(new kokopu.Position('empty').fen()).is(emptyFEN); });
	it('Constructor FEN-based 1', function() { test.value(new kokopu.Position(customFEN1).fen(optsFEN1)).is(customFEN1); });
	it('Constructor FEN-based 2', function() { test.value(new kokopu.Position(customFEN2).fen(optsFEN2)).is(customFEN2); });

	it('Copy constructor', function() {
		var p1 = new kokopu.Position(customFEN1);
		var p2 = new kokopu.Position(p1);
		p1.clear();

		test.value(p1.fen()).is(emptyFEN);
		test.value(p2.fen(optsFEN1)).is(customFEN1);
	});

});


describe('Strict FEN', function() {

	var customFEN1 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 10 5';
	var customFEN2 = 'k7/n1PB4/1K6/8/8/8/8/8 w - - 0 60';

	var optsFEN1 = { fiftyMoveClock: 10, fullMoveNumber: 5 };
	var optsFEN2 = { fullMoveNumber: 60 };

	var customFEN3  = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kq e3 0 1';
	var customFEN3a = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b qK e3 0 1';
	var customFEN3b = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kq e6 0 1';
	var customFEN3c = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kq e3 00 1';

	it('Set FEN (tolerant) A', function() { var p=new kokopu.Position(); p.fen(customFEN3a); test.value(p.fen()).is(customFEN3); });
	it('Set FEN (tolerant) B', function() { var p=new kokopu.Position(); p.fen(customFEN3b); test.value(p.fen()).is(customFEN3); });
	it('Set FEN (tolerant) C', function() { var p=new kokopu.Position(); p.fen(customFEN3c); test.value(p.fen()).is(customFEN3); });

	it('Set FEN (strict) OK 1', function() { var p=new kokopu.Position(); p.fen(customFEN1, true); test.value(p.fen(optsFEN1)).is(customFEN1); });
	it('Set FEN (strict) OK 2', function() { var p=new kokopu.Position(); p.fen(customFEN2, true); test.value(p.fen(optsFEN2)).is(customFEN2); });
	it('Set FEN (strict) OK 3', function() { var p=new kokopu.Position(); p.fen(customFEN3, true); test.value(p.fen()).is(customFEN3); });

	it('Set FEN (strict) NOK A', function() { var p=new kokopu.Position(); test.exception(function() { p.fen(customFEN3a, true); }).isInstanceOf(kokopu.exception.InvalidFEN); });
	it('Set FEN (strict) NOK B', function() { var p=new kokopu.Position(); test.exception(function() { p.fen(customFEN3b, true); }).isInstanceOf(kokopu.exception.InvalidFEN); });
	it('Set FEN (strict) NOK C', function() { var p=new kokopu.Position(); test.exception(function() { p.fen(customFEN3c, true); }).isInstanceOf(kokopu.exception.InvalidFEN); });

});


describe('Getters', function() {

	var customFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 0 1';

	it('Get board 1', function() { var p=new kokopu.Position(); test.value(p.square('e1')).is('wk'); });
	it('Get board 2', function() { var p=new kokopu.Position(); test.value(p.square('f7')).is('bp'); });
	it('Get board 3', function() { var p=new kokopu.Position(); test.value(p.square('b4')).is('-'); });

	it('Get turn 1', function() { var p=new kokopu.Position(); test.value(p.turn()).is('w'); });
	it('Get turn 2', function() { var p=new kokopu.Position(customFEN); test.value(p.turn()).is('b'); });

	it('Get castling 1', function() { var p=new kokopu.Position(); test.value(p.castling('wq')).is(true); });
	it('Get castling 2', function() { var p=new kokopu.Position(customFEN); test.value(p.castling('bq')).is(false); });
	it('Get castling 3', function() { var p=new kokopu.Position(customFEN); test.value(p.castling('bk')).is(true); });

	it('Get en-passant 1', function() { var p=new kokopu.Position(); test.value(p.enPassant()).is('-'); });
	it('Get en-passant 2', function() { var p=new kokopu.Position(customFEN); test.value(p.enPassant()).is('e'); });

	['j1', 'f9'].forEach(function(elem) {
		it('Error for board with ' + elem, function() {
			var p=new kokopu.Position();
			test.exception(function() { p.square(elem); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	});

	['bK', 'wa'].forEach(function(elem) {
		it('Error for castling with ' + elem, function() {
			var p=new kokopu.Position();
			test.exception(function() { p.castling(elem); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	});

});


describe('Setters', function() {

	var pos1 = new kokopu.Position('start');
	var pos2 = new kokopu.Position('empty');

	it('Set board 1a', function() { pos1.square('a8', '-'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); });
	it('Set board 1b', function() { pos1.square('f6', 'wb'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); });

	it('Set board 2a', function() { pos2.square('c3', 'bk'); test.value(pos2.fen()).is('8/8/8/8/8/2k5/8/8 w - - 0 1'); });
	it('Set board 2b', function() { pos2.square('g5', 'wk'); test.value(pos2.fen()).is('8/8/8/6K1/8/2k5/8/8 w - - 0 1'); });
	it('Set board 2c', function() { pos2.square('c3', '-'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 w - - 0 1'); });

	it('Set turn 1', function() { pos1.turn('w'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); });
	it('Set turn 2', function() { pos2.turn('b'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b - - 0 1'); });

	it('Set castling 1a', function() { pos1.castling('wk', false); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1'); });
	it('Set castling 1b', function() { pos1.castling('bk', true); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1'); });
	it('Set castling 2a', function() { pos2.castling('wq', false); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b - - 0 1'); });
	it('Set castling 2b', function() { pos2.castling('bq', true); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b q - 0 1'); });

	it('Set en-passant 1a', function() { pos1.enPassant('e'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq e6 0 1'); });
	it('Set en-passant 1b', function() { pos1.enPassant('-'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1'); });
	it('Set en-passant 2a', function() { pos2.enPassant('a'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b q a3 0 1'); });
	it('Set en-passant 2b', function() { pos2.enPassant('h'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b q h3 0 1'); });

});

