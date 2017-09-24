
const RPBChess = require('../src/core.js');
const test = require('unit.js');

describe('Getters', function() {

	const customFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 0 1';

	it('Getter board 1', function() { var p=new RPBChess.Position(); test.value(p.square('e1')).is('wk'); });
	it('Getter board 2', function() { var p=new RPBChess.Position(); test.value(p.square('f7')).is('bp'); });
	it('Getter board 3', function() { var p=new RPBChess.Position(); test.value(p.square('b4')).is('-'); });

	it('Getter turn 1', function() { var p=new RPBChess.Position(); test.value(p.turn()).is('w'); });
	it('Getter turn 2', function() { var p=new RPBChess.Position(customFEN); test.value(p.turn()).is('b'); });

	it('Getter castling 1', function() { var p=new RPBChess.Position(); test.value(p.castleRights('wq')).is(true); });
	it('Getter castling 2', function() { var p=new RPBChess.Position(customFEN); test.value(p.castleRights('bq')).is(false); });
	it('Getter castling 3', function() { var p=new RPBChess.Position(customFEN); test.value(p.castleRights('bk')).is(true); });

	it('Getter en-passant 1', function() { var p=new RPBChess.Position(); test.value(p.enPassant()).is('-'); });
	it('Getter en-passant 2', function() { var p=new RPBChess.Position(customFEN); test.value(p.enPassant()).is('e'); });

	['j1', 'f9'].forEach(function(elem) {
		it('Error for board with ' + elem, function() {
			var p=new RPBChess.Position();
			test.exception(function() { p.square(elem); }).isInstanceOf(RPBChess.exceptions.IllegalArgument);
		});
	});

	['bK', 'wa'].forEach(function(elem) {
		it('Error for castling with ' + elem, function() {
			var p=new RPBChess.Position();
			test.exception(function() { p.castleRights(elem); }).isInstanceOf(RPBChess.exceptions.IllegalArgument);
		});
	});

});
