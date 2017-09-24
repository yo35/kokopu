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


describe('Constructor', function() {

	var startFEN   = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	var emptyFEN   = '8/8/8/8/8/8/8/8 w - - 0 1';
	var customFEN1 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 10 5';
	var customFEN2 = 'k7/n1PB4/1K6/8/8/8/8/8 w - - 0 60';

	var optsFEN1 = { fiftyMoveClock: 10, fullMoveNumber: 5 };
	var optsFEN2 = { fullMoveNumber: 60 };

	it('Default constructor'    , function() { test.value(new RPBChess.Position().fen()).is(startFEN); });
	it('Constructor \'start\''  , function() { test.value(new RPBChess.Position('start').fen()).is(startFEN); });
	it('Constructor \'empty\''  , function() { test.value(new RPBChess.Position('empty').fen()).is(emptyFEN); });
	it('Constructor FEN-based 1', function() { test.value(new RPBChess.Position(customFEN1).fen(optsFEN1)).is(customFEN1); });
	it('Constructor FEN-based 2', function() { test.value(new RPBChess.Position(customFEN2).fen(optsFEN2)).is(customFEN2); });

	it('Copy constructor', function() {
		var p1 = new RPBChess.Position(customFEN1);
		var p2 = new RPBChess.Position(p1);
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

	it('Set FEN (tolerant) A', function() { var p=new RPBChess.Position(); p.fen(customFEN3a); test.value(p.fen()).is(customFEN3); });
	it('Set FEN (tolerant) B', function() { var p=new RPBChess.Position(); p.fen(customFEN3b); test.value(p.fen()).is(customFEN3); });
	it('Set FEN (tolerant) C', function() { var p=new RPBChess.Position(); p.fen(customFEN3c); test.value(p.fen()).is(customFEN3); });

	it('Set FEN (strict) OK 1', function() { var p=new RPBChess.Position(); p.fen(customFEN1, true); test.value(p.fen(optsFEN1)).is(customFEN1); });
	it('Set FEN (strict) OK 2', function() { var p=new RPBChess.Position(); p.fen(customFEN2, true); test.value(p.fen(optsFEN2)).is(customFEN2); });
	it('Set FEN (strict) OK 3', function() { var p=new RPBChess.Position(); p.fen(customFEN3, true); test.value(p.fen()).is(customFEN3); });

	it('Set FEN (strict) NOK A', function() { var p=new RPBChess.Position(); test.exception(function() { p.fen(customFEN3a, true); }).isInstanceOf(RPBChess.exception.InvalidFEN); });
	it('Set FEN (strict) NOK B', function() { var p=new RPBChess.Position(); test.exception(function() { p.fen(customFEN3b, true); }).isInstanceOf(RPBChess.exception.InvalidFEN); });
	it('Set FEN (strict) NOK C', function() { var p=new RPBChess.Position(); test.exception(function() { p.fen(customFEN3c, true); }).isInstanceOf(RPBChess.exception.InvalidFEN); });

});

