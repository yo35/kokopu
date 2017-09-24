
const RPBChess = require('../src/core.js');
const test = require('unit.js');

describe('Getters', function() {

	var pos1 = new RPBChess.Position('start');
	var pos2 = new RPBChess.Position('empty');

	it('Setter board 1a', function() { pos1.square('a8', '-'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); });
	it('Setter board 1b', function() { pos1.square('f6', 'wb'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); });

	it('Setter board 2a', function() { pos2.square('c3', 'bk'); test.value(pos2.fen()).is('8/8/8/8/8/2k5/8/8 w - - 0 1'); });
	it('Setter board 2b', function() { pos2.square('g5', 'wk'); test.value(pos2.fen()).is('8/8/8/6K1/8/2k5/8/8 w - - 0 1'); });
	it('Setter board 2c', function() { pos2.square('c3', '-'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 w - - 0 1'); });

	it('Setter turn 1', function() { pos1.turn('w'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); });
	it('Setter turn 2', function() { pos2.turn('b'); test.value(pos1.fen()).is('8/8/8/6K1/8/8/8/8 b - - 0 1'); });

	it('Setter castling 1a', function() { pos1.castleRights('wk', false); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1'); });
	it('Setter castling 1b', function() { pos1.castleRights('bk', true); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1'); });
	it('Setter castling 2a', function() { pos2.castleRights('wq', false); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b - - 0 1'); });
	it('Setter castling 2b', function() { pos2.castleRights('bq', true); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b q - 0 1'); });

	it('Setter en-passant 1a', function() { pos1.enPassant('e'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq e6 0 1'); });
	it('Setter en-passant 1b', function() { pos1.enPassant('-'); test.value(pos1.fen()).is('1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qkq - 0 1'); });
	it('Setter en-passant 2a', function() { pos2.enPassant('a'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b q a3 0 1'); });
	it('Setter en-passant 2b', function() { pos2.enPassant('h'); test.value(pos2.fen()).is('8/8/8/6K1/8/8/8/8 b q h3 0 1'); });

});
