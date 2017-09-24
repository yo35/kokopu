
const RPBChess = require('../src/core.js');
const test = require('unit.js');

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

	it('Set FEN (strict) NOK A', function() { var p=new RPBChess.Position(); test.exception(function() { p.fen(customFEN3a, true); }).isInstanceOf(RPBChess.exceptions.InvalidFEN); });
	it('Set FEN (strict) NOK B', function() { var p=new RPBChess.Position(); test.exception(function() { p.fen(customFEN3b, true); }).isInstanceOf(RPBChess.exceptions.InvalidFEN); });
	it('Set FEN (strict) NOK C', function() { var p=new RPBChess.Position(); test.exception(function() { p.fen(customFEN3c, true); }).isInstanceOf(RPBChess.exceptions.InvalidFEN); });

});
