/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2022  Yoann Le Montagner <yo35 -at- melix.net>       *
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
 * -------------------------------------------------------------------------- */


const { exception, Position, forEachSquare } = require('../dist/lib/index');
const test = require('unit.js');


function itInvalidArgument(label, action) {
	it(label, () => {
		const position = new Position();
		test.exception(() => action(position)).isInstanceOf(exception.IllegalArgument);
	});
}


describe('isAttacked', () => {

	function itIsAttacked(label, fen, byWho, attackedSquares) {
		it(label, () => {
			const position = new Position(fen);
			const res = [];
			forEachSquare(square => {
				if (position.isAttacked(square, byWho)) {
					res.push(square);
				}
			});
			test.value(res.join('/')).is(attackedSquares);
		});
	}

	itIsAttacked('King attacks', '8/8/8/4K3/8/8/8/8 w - - 0 1', 'w', 'd4/e4/f4/d5/f5/d6/e6/f6');
	itIsAttacked('Queen attacks', '8/8/8/4q3/8/8/8/8 w - - 0 1', 'b', 'a1/e1/b2/e2/h2/c3/e3/g3/d4/e4/f4/a5/b5/c5/d5/f5/g5/h5/d6/e6/f6/c7/e7/g7/b8/e8/h8');
	itIsAttacked('Rook attacks', '8/8/8/4R3/8/8/8/8 w - - 0 1', 'w', 'e1/e2/e3/e4/a5/b5/c5/d5/f5/g5/h5/e6/e7/e8');
	itIsAttacked('Bishop attacks', '8/8/8/4b3/8/8/8/8 w - - 0 1', 'b', 'a1/b2/h2/c3/g3/d4/f4/d6/f6/c7/g7/b8/h8');
	itIsAttacked('Knight attacks', '8/8/8/4N3/8/8/8/8 w - - 0 1', 'w', 'd3/f3/c4/g4/c6/g6/d7/f7');
	itIsAttacked('White pawn attacks', '8/8/8/4P3/8/8/8/8 w - - 0 1', 'w', 'd6/f6');
	itIsAttacked('Black pawn attacks', '8/8/8/4p3/8/8/8/8 w - - 0 1', 'b', 'd4/f4');

	itInvalidArgument('Invalid square 1', position => position.isAttacked('b9', 'w'));
	itInvalidArgument('Invalid square 2', position => position.isAttacked('k1', 'w'));
	itInvalidArgument('Invalid square 3', position => position.isAttacked('', 'w'));
	itInvalidArgument('Invalid color 1', position => position.isAttacked('e3', 'z'));
	itInvalidArgument('Invalid color 2', position => position.isAttacked('e3', ''));
});


describe('getAttacks', () => {

	function itGetAttacks(label, fen, byWho, squares) {
		it(label, () => {
			const position = new Position(fen);
			for (const sq in squares) {
				const attacks = position.getAttacks(sq, byWho).sort().join('/');
				test.value(attacks).is(squares[sq]);
			}
		});
	}

	itGetAttacks('Single attack', '8/8/8/4Q3/8/8/8/8 w - - 0 1', 'w', { c3: 'e5', d2: '' });
	itGetAttacks('Double attacks', '8/8/8/4r3/8/1q6/8/8 w - - 0 1', 'b', { c7: '', e1: 'e5', e6: 'b3/e5', g8: 'b3' });
	itGetAttacks('Multiple attacks 1', '8/8/5B2/1B6/3RN3/8/8/8 w - - 0 1', 'w', { c3: 'e4', d2: 'd4/e4', d4: 'f6', d7: 'b5/d4', d8: 'd4/f6', g4: '', g5: 'e4/f6' });
	itGetAttacks('Multiple attacks 2', '1r2r2k/1bq3bp/p2p2n1/1p1P1Qp1/4B3/PP2R3/1BP3PP/5R1K w - - 0 1', 'w', { a8: '', b4: 'a3', e5: 'b2/f5', f3: 'e3/e4/f1/f5/g2', g2: 'e4/h1' });
	itGetAttacks('Multiple attacks 3', '1r2r2k/1bq3bp/p2p2n1/1p1P1Qp1/4B3/PP2R3/1BP3PP/5R1K w - - 0 1', 'b', { a8: 'b7/b8', b4: '', e5: 'd6/e8/g6/g7', f3: '', g2: '' });

	itInvalidArgument('Invalid square 1', position => position.getAttacks('m7', 'w'));
	itInvalidArgument('Invalid square 2', position => position.getAttacks('dfsdf', 'w'));
	itInvalidArgument('Invalid color 1', position => position.getAttacks('e3', 'W'));
	itInvalidArgument('Invalid color 2', position => position.getAttacks('e3', 'n'));
});


describe('kingSquare', () => {
	itInvalidArgument('Invalid color 1', position => position.kingSquare('B'));
	itInvalidArgument('Invalid color 2', position => position.kingSquare('whatever'));
});


describe('Move legality check', () => {

	itInvalidArgument('Invalid square from', position => position.isMoveLegal('c0', 'e4'));
	itInvalidArgument('Invalid square to', position => position.isMoveLegal('b3', 'A2'));

	function itValidMove(label, fen, from, to, expectedSignature) {
		it(label, () => {
			const position = new Position(fen);
			const md = position.isMoveLegal(from, to);
			test.value(md).isFunction().hasProperty('status', 'regular');
			test.value(md().toString()).is(expectedSignature);
		});
	}

	itValidMove('Regular move', 'start', 'e2', 'e4', 'e2e4');
	itValidMove('Castling move', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1', 'g1', 'e1g1O');
	itValidMove('Castling move (Chess960)', 'chess960:r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', 'e8', 'h8', 'e8g8O');

	function itInvalidMove(label, fen, from, to) {
		it(label, () => {
			const position = new Position(fen);
			const md = position.isMoveLegal(from, to);
			test.value(md).is(false);
		});
	}

	itInvalidMove('KxR at regular chess', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', 'e8', 'h8');
	itInvalidMove('Non-KxR at Chess960', 'chess960:r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1', 'g1');

	function itInvalidPromotionPiece(label, fen, from, to, promo) {
		it(label, () => {
			const position = new Position(fen);
			const md = position.isMoveLegal(from, to);
			test.value(md).isFunction().hasProperty('status', 'promotion');
			test.exception(() => md(promo)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidPromotionPiece('Invalid promotion piece 1', '8/4K3/8/8/8/8/6pk/8 b - - 0 1', 'g2', 'g1', 'whatever');
	itInvalidPromotionPiece('Invalid promotion piece 2', '8/4K3/8/8/8/8/p6k/8 b - - 0 1', 'a2', 'a1', 'k');
	itInvalidPromotionPiece('Invalid promotion piece 3', '8/4K3/8/8/8/8/p6k/8 b - - 0 1', 'a2', 'a1', 'p');
});


describe('Parse degenerated notation', () => {

	function itDegeneratedNotation(label, fen, move, expected) {
		it(label, () => {
			const position = new Position(fen);
			const md = position.notation(move);
			test.value(md.toString()).is(expected);
		});
	}

	itDegeneratedNotation('King-side castling move with zero characters', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', '0-0', 'e1g1O');
	itDegeneratedNotation('Queen-side castling move with zero characters', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', '0-0-0', 'e8c8O');
});


describe('Parse and play move', () => {

	it('Legal move', () => {
		const position = new Position();
		test.value(position.play('e4')).is(true);
		test.value(position.fen()).is('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
	});

	function itInvalidMove(label, fen, move) {
		it(label, () => {
			const position = new Position(fen);
			test.value(position.play(move)).is(false);
			test.value(position.fen()).is(fen);
		});
	}

	itInvalidMove('Illegal move 1', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Ng3');
	itInvalidMove('Illegal move 2', 'r1bqkbnr/ppp2ppp/2B5/3pp3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1', 'dxe4');

	it('No argument', () => {
		const position = new Position();
		test.exception(() => position.play()).isInstanceOf(exception.IllegalArgument);
	});

	it('Invalid argument type', () => {
		const position = new Position();
		test.exception(() => position.play(42)).isInstanceOf(exception.IllegalArgument);
	});
});


describe('Play null-move', () => {

	function itNullMove(label, fen, expected, fenAfter) {
		it(label, () => {
			const position = new Position(fen);
			test.value(position.playNullMove()).is(expected);
			test.value(position.fen()).is(expected ? fenAfter : fen);
		});
	}

	itNullMove('Legal null-move', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', true, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');
	itNullMove('Illegal null-move', 'r1bqkbnr/ppp2ppp/2B5/3pp3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1', false);
});
