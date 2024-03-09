/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2024  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    Kokopu is free software: you can redistribute it and/or                 *
 *    modify it under the terms of the GNU Lesser General Public License      *
 *    as published by the Free Software Foundation, either version 3 of       *
 *    the License, or (at your option) any later version.                     *
 *                                                                            *
 *    Kokopu is distributed in the hope that it will be useful,               *
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


describe('Figurine notation', () => {

    function itParseFigurineNotation(label, fen, figurineMove, sanMove) {
        it(`Generate ${label}`, () => {
            const position = new Position(fen);
            const md = position.notation(sanMove, true);
            test.value(position.figurineNotation(md)).is(figurineMove);
        });
        it(`Parse ${label}`, () => {
            const position = new Position(fen);
            const md = position.figurineNotation(figurineMove);
            test.value(position.notation(md)).is(sanMove);
        });
        it(`Parse ${label} (strict)`, () => {
            const position = new Position(fen);
            const md = position.figurineNotation(figurineMove, true);
            test.value(position.notation(md)).is(sanMove);
        });
    }

    itParseFigurineNotation('white pawn move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', 'b4', 'b4');
    itParseFigurineNotation('black pawn move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', 'dxe4', 'dxe4');
    itParseFigurineNotation('white pawn move with promotion', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', 'b8=\u2655', 'b8=Q');
    itParseFigurineNotation('black pawn move with promotion', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', 'gxh1=\u265e', 'gxh1=N');
    itParseFigurineNotation('white knight move', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', '\u2658f3', 'Nf3');
    itParseFigurineNotation('black knight move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', '\u265ecd4', 'Ncd4');
    itParseFigurineNotation('white bishop move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', '\u2657b5', 'Bb5');
    itParseFigurineNotation('black bishop move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', '\u265dxf2+', 'Bxf2+');
    itParseFigurineNotation('white rook move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', '\u2656xa7', 'Rxa7');
    itParseFigurineNotation('black rook move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', '\u265cg8', 'Rg8');
    itParseFigurineNotation('white queen move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', '\u2655xc5', 'Qxc5');
    itParseFigurineNotation('black queen move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', '\u265be7', 'Qe7');
    itParseFigurineNotation('white king move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', '\u2654e2', 'Ke2');
    itParseFigurineNotation('black king move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', '\u265af8', 'Kf8');
    itParseFigurineNotation('white castling move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R w KQkq - 0 1', 'O-O-O', 'O-O-O');
    itParseFigurineNotation('black castling move', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', 'O-O', 'O-O');
});


describe('King-take-rook flag for UCI notation generation', () => {

    function itGenerateUCIWithKxR(label, variant, forceKxR, expectedUCI) {
        it(label, () => {
            const position = new Position(variant, 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
            const moveDescriptor = position.notation('O-O');
            test.value(position.uci(moveDescriptor, forceKxR)).is(expectedUCI);
        });
    }

    itGenerateUCIWithKxR('Force KxR at regular chess', 'regular', true, 'e1h1');
    itGenerateUCIWithKxR('Do not force KxR at regular chess', 'regular', false, 'e1g1');
    itGenerateUCIWithKxR('Force KxR at Chess960', 'chess960', true, 'e1h1');
    itGenerateUCIWithKxR('Do not force KxR at Chess960', 'chess960', false, 'e1h1');
});


describe('King-take-rook flag for UCI notation parsing', () => {

    function itParseValidUCIWithKxR(label, variant, uciNotation, strict) {
        it(label, () => {
            const position = new Position(variant, 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
            const moveDescriptor = position.uci(uciNotation, strict);
            test.value(position.notation(moveDescriptor)).is('O-O');
        });
    }

    function itParseInvalidUCIWithKxR(label, variant, uciNotation, strict) {
        it(label + ' (invalid)', () => {
            const position = new Position(variant, 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
            test.exception(() => position.uci(uciNotation, strict)).isInstanceOf(exception.InvalidNotation);
        });
    }

    itParseValidUCIWithKxR('Regular chess, king-move style, non-strict mode', 'regular', 'e1g1', false);
    itParseValidUCIWithKxR('Regular chess, king-move style, strict mode', 'regular', 'e1g1', true);
    itParseValidUCIWithKxR('Regular chess, KxR style, non-strict mode', 'regular', 'e1h1', false);
    itParseInvalidUCIWithKxR('Regular chess, KxR style, strict mode', 'regular', 'e1h1', true);
    itParseInvalidUCIWithKxR('Chess960, king-move style, non-strict mode', 'chess960', 'e1g1', false);
    itParseInvalidUCIWithKxR('Chess960, king-move style, strict mode', 'chess960', 'e1g1', true);
    itParseValidUCIWithKxR('Chess960, KxR style, non-strict mode', 'chess960', 'e1h1', false);
    itParseValidUCIWithKxR('Chess960, KxR style, strict mode', 'chess960', 'e1h1', true);
});


describe('Parse invalid notation', () => {

    function itInvalidNotation(label, parsingAction) {
        it(label, () => {
            const position = new Position();
            test.exception(() => parsingAction(position)).isInstanceOf(exception.InvalidNotation);
        });
    }

    itInvalidNotation('Invalid input for SAN notation parsing 1', p => p.notation('e2e4'));
    itInvalidNotation('Invalid input for SAN notation parsing 2', p => p.notation('Zf3'));
    itInvalidNotation('Invalid input for figurine notation parsing', p => p.figurineNotation('Nf3'));
    itInvalidNotation('Invalid input for UCI notation parsing', p => p.uci('Nf3'));
});


describe('Parse degenerated notation', () => {

    function itDegeneratedNotation(label, fen, move, expected, expectedSAN) {
        it(label, () => {
            const position = new Position(fen);
            const md = position.notation(move);
            test.value(md.toString()).is(expected);
            test.value(position.notation(md)).is(expectedSAN);
        });
        it(label + ' (error if strict)', () => {
            const position = new Position(fen);
            test.exception(() => position.notation(move, true)).isInstanceOf(exception.InvalidNotation);
        });
    }

    itDegeneratedNotation('King-side castling move with zero characters', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', '0-0', 'e1g1O', 'O-O');
    itDegeneratedNotation('Queen-side castling move with zero characters', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1', '0-0-0', 'e8c8O', 'O-O-O');
    itDegeneratedNotation('Unexpected capture symbol', 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', 'Nxf6', 'g8f6', 'Nf6');
    itDegeneratedNotation('Missing capture symbol', 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Ne5', 'f3e5', 'Nxe5');
    itDegeneratedNotation('Missing promotion symbol', 'K6k/8/8/8/8/8/3p4/8 b - - 0 1', 'd1Q', 'd2d1Q', 'd1=Q');
    itDegeneratedNotation('Error on disambiguation symbol 1', '1n2k3/8/8/4n3/8/8/8/4K3 b - - 0 1', 'N8c6', 'b8c6', 'Nbc6');
    itDegeneratedNotation('Error on disambiguation symbol 2', 'R7/8/8/7k/8/8/8/R6K w - - 0 1', 'Ra1a5+', 'a1a5', 'R1a5+');
    itDegeneratedNotation('Missing check symbol', '4k3/8/8/8/8/8/7R/4K3 w - - 0 1', 'Rh8', 'h2h8', 'Rh8+');
    itDegeneratedNotation('Missing checkmate symbol', '4k3/R7/8/8/8/8/7R/4K3 w - - 0 1', 'Rh8', 'h2h8', 'Rh8#');
    itDegeneratedNotation('Unexpected check symbol', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'O-O+', 'e1g1O', 'O-O');
    itDegeneratedNotation('Unexpected checkmate symbol', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'O-O-O#', 'e1c1O', 'O-O-O');
});


describe('Parse degenerated figurine notation', () => {

    function itDegeneratedNotation(label, fen, move, expected, expectedSAN) {
        it(label, () => {
            const position = new Position(fen);
            const md = position.figurineNotation(move);
            test.value(md.toString()).is(expected);
            test.value(position.notation(md)).is(expectedSAN);
        });
        it(label + ' (error if strict)', () => {
            const position = new Position(fen);
            test.exception(() => position.figurineNotation(move, true)).isInstanceOf(exception.InvalidNotation);
        });
    }

    itDegeneratedNotation('Invalid color', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', '\u265ef3', 'g1f3', 'Nf3');
    itDegeneratedNotation('Invalid color on promotion', 'r1bqk2r/pPp2pp1/2n1n3/2bpp3/4P3/2Q2N2/1PPP1PpP/R3KB1R b KQkq - 0 1', 'gxh1=\u2658', 'g2h1N', 'gxh1=N');
});


describe('Invalid notation parsing overloads', () => {

    function itInvalidOverload(label, action) {
        it(label, () => {
            const position = new Position();
            test.exception(() => action(position)).isInstanceOf(exception.IllegalArgument);
        });
    }

    itInvalidOverload('No argument on notation()', pos => pos.notation());
    itInvalidOverload('Non-string argument on notation()', pos => pos.notation(42));
    itInvalidOverload('No argument on figurineNotation()', pos => pos.figurineNotation());
    itInvalidOverload('Non-string argument on figurineNotation()', pos => pos.figurineNotation(null));
    itInvalidOverload('No argument on uci()', pos => pos.uci());
    itInvalidOverload('Non-string argument on uci()', pos => pos.uci({}));
});


describe('Parse and play move', () => {

    it('Legal move (notation)', () => {
        const position = new Position();
        test.value(position.play('e4')).is(true);
        test.value(position.fen()).is('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    });

    it('Legal move (descriptor)', () => {
        const position = new Position();
        const md = position.notation('Nf3', true);
        test.value(position.play(md)).is(true);
        test.value(position.fen()).is('rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 0 1');
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
