
const RPBChess = require('../src/core.js');
const test = require('unit.js');

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
