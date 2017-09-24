
const RPBChess = require('../src/core.js');
const test = require('unit.js');

describe('Getters', function() {

	const customFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 0 1';

	it('Get board 1', function() { var p=new RPBChess.Position(); test.value(p.square('e1')).is('wk'); });
	it('Get board 2', function() { var p=new RPBChess.Position(); test.value(p.square('f7')).is('bp'); });
	it('Get board 3', function() { var p=new RPBChess.Position(); test.value(p.square('b4')).is('-'); });

	it('Get turn 1', function() { var p=new RPBChess.Position(); test.value(p.turn()).is('w'); });
	it('Get turn 2', function() { var p=new RPBChess.Position(customFEN); test.value(p.turn()).is('b'); });

	it('Get castling 1', function() { var p=new RPBChess.Position(); test.value(p.castling('wq')).is(true); });
	it('Get castling 2', function() { var p=new RPBChess.Position(customFEN); test.value(p.castling('bq')).is(false); });
	it('Get castling 3', function() { var p=new RPBChess.Position(customFEN); test.value(p.castling('bk')).is(true); });

	it('Get en-passant 1', function() { var p=new RPBChess.Position(); test.value(p.enPassant()).is('-'); });
	it('Get en-passant 2', function() { var p=new RPBChess.Position(customFEN); test.value(p.enPassant()).is('e'); });

	['j1', 'f9'].forEach(function(elem) {
		it('Error for board with ' + elem, function() {
			var p=new RPBChess.Position();
			test.exception(function() { p.square(elem); }).isInstanceOf(RPBChess.exception.IllegalArgument);
		});
	});

	['bK', 'wa'].forEach(function(elem) {
		it('Error for castling with ' + elem, function() {
			var p=new RPBChess.Position();
			test.exception(function() { p.castling(elem); }).isInstanceOf(RPBChess.exception.IllegalArgument);
		});
	});

});
