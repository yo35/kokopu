/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2026  Yoann Le Montagner <yo35 -at- melix.net>       *
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


const { exception, Position } = require('../dist/lib/index');
const dumpCastlingFlags = require('./common/dumpcastlingflags');
const readCSV = require('./common/readcsv');
const assert = require('node:assert/strict');

const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const startXFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w AHah - 0 1';
const startFENAntichess = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
const startFENHorde = 'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1';
const emptyFEN = '8/8/8/8/8/8/8/8 w - - 0 1';
const customFEN = 'r3k2r/pb3pbp/1p4p1/3n4/1PpP4/P4NB1/5PPP/R3KB1R b KQkq d3 0 1';
const customFENNoCastling = 'r3k2r/pb3pbp/1p4p1/3n4/1PpP4/P4NB1/5PPP/R3KB1R b - d3 0 1';
const customFENWhiteCastlingOnly = 'r3k2r/pb3pbp/1p4p1/3n4/1PpP4/P4NB1/5PPP/R3KB1R b KQ d3 0 1';
const customFENBlackCastlingOnly = 'r3k2r/pb3pbp/1p4p1/3n4/1PpP4/P4NB1/5PPP/R3KB1R b kq d3 0 1';
const customXFEN = 'qrkbrnbn/pppppppp/8/8/8/8/PPPPPPPP/QRKBRNBN w BEbe - 0 1';
const customXFENAsFEN = 'qrkbrnbn/pppppppp/8/8/8/8/PPPPPPPP/QRKBRNBN w KQkq - 0 1';
const customFENHorde = '1Q3rk1/2P4p/1P2pp2/2PP4/5P1P/2q1PPPP/2P1PPPP/2PPPPPP b - - 0 1';

const variants = [ 'regular', 'chess960', 'no-king', 'white-king-only', 'black-king-only', 'antichess', 'horde' ];


describe('Position constructor', () => {

    function doTest(label, expectedVariant, expectedFEN, positionFactory) {
        it(label, () => {
            const position = positionFactory();
            assert.deepEqual(position.variant(), expectedVariant);
            assert.deepEqual(position.fen(), expectedFEN);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    doTest('Default constructor'  , 'regular', startFEN , () => new Position());
    doTest('Constructor \'start\'', 'regular', startFEN , () => new Position('start'));
    doTest('Constructor \'empty\'', 'regular', emptyFEN , () => new Position('empty'));
    doTest('Constructor FEN-based', 'regular', customFEN, () => new Position(customFEN));

    doTest('Default constructor (force regular)'              , 'regular', startFEN , () => new Position('regular'));
    doTest('Constructor \'start\' (force regular)'            , 'regular', startFEN , () => new Position('regular', 'start'));
    doTest('Constructor \'empty\' (force regular)'            , 'regular', emptyFEN , () => new Position('regular', 'empty'));
    doTest('Constructor FEN-based (force regular)'            , 'regular', customFEN, () => new Position('regular', customFEN));
    doTest('Constructor FEN-based with prefix (force regular)', 'regular', customFEN, () => new Position('regular:' + customFEN));

    doTest('Scharnagl constructor'                         , 'chess960', startXFEN , () => new Position('chess960', 518));
    doTest('Constructor \'empty\' (Chess960)'              , 'chess960', emptyFEN  , () => new Position('chess960', 'empty'));
    doTest('Constructor FEN-based (Chess960)'              , 'chess960', customXFEN, () => new Position('chess960', customXFENAsFEN));
    doTest('Constructor X-FEN-based (Chess960)'            , 'chess960', customXFEN, () => new Position('chess960', customXFEN));
    doTest('Constructor X-FEN-based with prefix (Chess960)', 'chess960', customXFEN, () => new Position('chess960:' + customXFEN));

    doTest('Constructor \'empty\' (no-king)'        , 'no-king'        , emptyFEN                  , () => new Position('no-king', 'empty'));
    doTest('Constructor FEN-based (no-king)'        , 'no-king'        , customFENNoCastling       , () => new Position('no-king', customFEN));
    doTest('Constructor \'empty\' (white-king-only)', 'white-king-only', emptyFEN                  , () => new Position('white-king-only', 'empty'));
    doTest('Constructor FEN-based (white-king-only)', 'white-king-only', customFENWhiteCastlingOnly, () => new Position('white-king-only', customFEN));
    doTest('Constructor \'empty\' (black-king-only)', 'black-king-only', emptyFEN                  , () => new Position('black-king-only', 'empty'));
    doTest('Constructor FEN-based (black-king-only)', 'black-king-only', customFENBlackCastlingOnly, () => new Position('black-king-only', customFEN));

    doTest('Default constructor (antichess)'              , 'antichess', startFENAntichess  , () => new Position('antichess'));
    doTest('Constructor \'start\' (antichess)'            , 'antichess', startFENAntichess  , () => new Position('antichess', 'start'));
    doTest('Constructor \'empty\' (antichess)'            , 'antichess', emptyFEN           , () => new Position('antichess', 'empty'));
    doTest('Constructor FEN-based (antichess)'            , 'antichess', customFENNoCastling, () => new Position('antichess', customFEN));
    doTest('Constructor FEN-based with prefix (antichess)', 'antichess', customFENNoCastling, () => new Position('antichess:' + customFEN));

    doTest('Default constructor (horde)'              , 'horde', startFENHorde , () => new Position('horde'));
    doTest('Constructor \'start\' (horde)'            , 'horde', startFENHorde , () => new Position('horde', 'start'));
    doTest('Constructor \'empty\' (horde)'            , 'horde', emptyFEN      , () => new Position('horde', 'empty'));
    doTest('Constructor FEN-based (horde)'            , 'horde', customFENHorde, () => new Position('horde', customFENHorde));
    doTest('Constructor FEN-based with prefix (horde)', 'horde', customFENHorde, () => new Position('horde:' + customFENHorde));

    /* eslint-enable */

    function doFailureTest(label, fenParsingErrorExpected, positionFactory) {
        it(label, () => { assert.throws(positionFactory, fenParsingErrorExpected ? exception.InvalidFEN : exception.IllegalArgument); });
    }

    doFailureTest('Invalid variant', false, () => new Position('not-a-variant', 'empty'));
    doFailureTest('Invalid variant (not a string)', false, () => new Position(42, 'empty'));
    doFailureTest('Invalid variant (FEN-based)', false, () => new Position('not-a-variant', startFEN));
    doFailureTest('Invalid variant (FEN-based with prefix)', true, () => new Position('not-a-variant:' + startFEN));
    doFailureTest('Invalid form 1', false, () => new Position(42));
    doFailureTest('Invalid form 2', false, () => new Position({}));
    doFailureTest('Invalid form 3', false, () => new Position('regular', 123));
    doFailureTest('Invalid form 4', false, () => new Position('regular', {}));
    doFailureTest('Variant without canonical start 1', false, () => new Position('no-king'));
    doFailureTest('Variant without canonical start 2', false, () => new Position('chess960', 'start'));
    doFailureTest('Invalid Scharnagl code NaN', false, () => new Position('chess960', NaN));
    doFailureTest('Invalid Scharnagl code -1', false, () => new Position('chess960', -1));

    doFailureTest('Invalid FEN string 1', true, () => new Position('rkr/ppp/8/8/8/8/PPP/RKR w - - 0 1'));
    doFailureTest('Invalid FEN string 2', true, () => new Position('8/8 w - - 0 1'));
    doFailureTest('Invalid FEN string 3', true, () => new Position('8/8/8/X7/8/8/8/8 w - - 0 1'));
    doFailureTest('Invalid FEN string 4', true, () => new Position('8/8/8/8/8/8/8/8 x - - 0 1'));
    doFailureTest('Invalid FEN string 5a', true, () => new Position('8/8/8/8/8/8/8/8 w - j6 0 1'));
    doFailureTest('Invalid FEN string 5b', true, () => new Position('8/8/8/8/8/8/8/8 w - a5 0 1'));
    doFailureTest('Invalid FEN string 6a', true, () => new Position('8/8/8/8/8/8/8/8 w - - xxx 1'));
    doFailureTest('Invalid FEN string 6b', true, () => new Position('8/8/8/8/8/8/8/8 w - - 0 xxx'));
    doFailureTest('Invalid FEN string with invalid variant', true, () => new Position('Something strange: a string with a colon in it...'));
    doFailureTest('Invalid FEN string with variant', true, () => new Position('regular', 'NotAFENString'));
    doFailureTest('Invalid FEN string with variant (as prefix)', true, () => new Position('regular:NotAFENString'));
});


describe('Position copy constructor', () => {

    function itCopy(variant, inputCustomFEN, expectedFEN) {
        it('Copy from ' + variant, () => {

            // Initialize the positions.
            const p1 = new Position(variant, inputCustomFEN);
            const p2 = new Position(p1);
            p1.clear(variant);

            // Check their states
            assert.deepEqual(p1.variant(), variant);
            assert.deepEqual(p2.variant(), variant);
            assert.deepEqual(p1.fen(), emptyFEN);
            assert.deepEqual(p2.fen(), expectedFEN);
        });
    }

    itCopy('regular', customFEN, customFEN);
    itCopy('chess960', customXFEN, customXFEN);
    itCopy('no-king', customFEN, customFENNoCastling);
    itCopy('white-king-only', customFEN, customFENWhiteCastlingOnly);
    itCopy('black-king-only', customFEN, customFENBlackCastlingOnly);
    itCopy('antichess', customFEN, customFENNoCastling);
    itCopy('horde', customFENHorde, customFENHorde);
});


describe('Clear mutator', () => {
    for (const variantSource of variants) {

        it('From ' + variantSource + ' to default', () => {
            const position = new Position(variantSource, customFEN);
            position.clear();
            assert.deepEqual(position.variant(), 'regular');
            assert.deepEqual(position.fen(), emptyFEN);
        });

        for (const variantTarget of variants) {
            it('From ' + variantSource + ' to ' + variantTarget, () => {
                const position = new Position(variantSource, customFEN);
                position.clear(variantTarget);
                assert.deepEqual(position.variant(), variantTarget);
                assert.deepEqual(position.fen(), emptyFEN);
            });
        }

        it('From ' + variantSource + ' to error', () => {
            const position = new Position(variantSource, customFEN);
            assert.throws(() => position.clear('not-a-variant'), exception.IllegalArgument);
        });
    }
});


describe('Reset mutator', () => {
    for (const variant of variants) {
        it('From ' + variant, () => {
            const position = new Position(variant, customFEN);
            position.reset();
            assert.deepEqual(position.variant(), 'regular');
            assert.deepEqual(position.fen(), startFEN);
        });
    }
});


describe('Reset 960 mutator', () => {
    for (const variant of variants) {
        it('From ' + variant, () => {
            const position = new Position(variant, customFEN);
            position.reset960(518);
            assert.deepEqual(position.variant(), 'chess960');
            assert.deepEqual(position.fen(), startXFEN);
        });
    }

    for (const elem of [ 960, 18.3, '546' ]) {
        it('Error with Scharnagl code ' + elem, () => {
            const p = new Position();
            assert.throws(() => p.reset960(elem), exception.IllegalArgument);
        });
    }
});


describe('Reset antichess mutator', () => {
    for (const variant of variants) {
        it('From ' + variant, () => {
            const position = new Position(variant, customFEN);
            position.resetAntichess();
            assert.deepEqual(position.variant(), 'antichess');
            assert.deepEqual(position.fen(), startFENAntichess);
        });
    }
});


describe('Reset horde mutator', () => {
    for (const variant of variants) {
        it('From ' + variant, () => {
            const position = new Position(variant, customFEN);
            position.resetHorde();
            assert.deepEqual(position.variant(), 'horde');
            assert.deepEqual(position.fen(), startFENHorde);
        });
    }
});


describe('Position Scharnagl constructor', () => {

    const testData = readCSV('scharnagl.csv', fields => {
        return {
            scharnaglCode: parseInt(fields[0]),
            fen: fields[3],
        };
    });

    for (const elem of testData) {
        it('Chess960 initial position ' + elem.scharnaglCode, () => {
            const position = new Position('chess960', elem.scharnaglCode);
            assert.deepEqual(position.variant(), 'chess960');
            assert.deepEqual(position.fen(), elem.fen);
        });
    }
});


describe('Position getters', () => {

    const currentFEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b Kk e3 0 1';

    it('Get board 1', () => { const p = new Position(); assert.deepEqual(p.square('e1'), 'wk'); });
    it('Get board 2', () => { const p = new Position(); assert.deepEqual(p.square('f7'), 'bp'); });
    it('Get board 3', () => { const p = new Position(); assert.deepEqual(p.square('b4'), '-'); });

    it('Get turn 1', () => { const p = new Position(); assert.deepEqual(p.turn(), 'w'); });
    it('Get turn 2', () => { const p = new Position(currentFEN); assert.deepEqual(p.turn(), 'b'); });

    it('Get castling 1', () => { const p = new Position(); assert.deepEqual(p.castling('wq'), true); });
    it('Get castling 2', () => { const p = new Position(currentFEN); assert.deepEqual(p.castling('bq'), false); });
    it('Get castling 3', () => { const p = new Position(currentFEN); assert.deepEqual(p.castling('bk'), true); });
    it('Get castling 4 (chess960)', () => { const p = new Position('chess960', 763); assert.deepEqual(p.castling('wa'), true); });
    it('Get castling 5 (chess960)', () => { const p = new Position('chess960', 763); assert.deepEqual(p.castling('wb'), false); });
    it('Get castling 6 (chess960)', () => { const p = new Position('chess960', 763); assert.deepEqual(p.castling('bf'), true); });
    it('Get castling 7 (chess960)', () => { const p = new Position('chess960', 763); assert.deepEqual(p.castling('bh'), false); });
    it('Get castling 8 (no-king)', () => { const p = new Position('no-king', 'empty'); assert.deepEqual(p.castling('bq'), false); });
    it('Get castling 9 (no-king)', () => { const p = new Position('no-king', startFEN); assert.deepEqual(p.castling('wk'), true); });
    it('Get castling 10 (white-king-only)', () => { const p = new Position('white-king-only', 'empty'); assert.deepEqual(p.castling('wk'), false); });
    it('Get castling 11 (white-king-only)', () => { const p = new Position('white-king-only', 'empty'); assert.deepEqual(p.castling('bq'), false); });
    it('Get castling 12 (white-king-only)', () => { const p = new Position('white-king-only', startFEN); assert.deepEqual(p.castling('wq'), true); });
    it('Get castling 13 (white-king-only)', () => { const p = new Position('white-king-only', startFEN); assert.deepEqual(p.castling('bk'), true); });
    it('Get castling 14 (black-king-only)', () => { const p = new Position('black-king-only', 'empty'); assert.deepEqual(p.castling('wk'), false); });
    it('Get castling 15 (black-king-only)', () => { const p = new Position('black-king-only', 'empty'); assert.deepEqual(p.castling('bq'), false); });
    it('Get castling 16 (black-king-only)', () => { const p = new Position('black-king-only', startFEN); assert.deepEqual(p.castling('wq'), true); });
    it('Get castling 17 (black-king-only)', () => { const p = new Position('black-king-only', startFEN); assert.deepEqual(p.castling('bk'), true); });

    it('Get en-passant 1', () => { const p = new Position(); assert.deepEqual(p.enPassant(), '-'); });
    it('Get en-passant 2', () => { const p = new Position(currentFEN); assert.deepEqual(p.enPassant(), 'e'); });

    for (const elem of [ 'j1', 'f9' ]) {
        it('Error for board with ' + elem, () => {
            const p = new Position();
            assert.throws(() => p.square(elem), exception.IllegalArgument);
        });
    }

    for (const elem of [ 'bK', 'wa' ]) {
        it('Error for castling with ' + elem, () => {
            const p = new Position();
            assert.throws(() => p.castling(elem), exception.IllegalArgument);
            assert.throws(() => p.effectiveCastling(elem), exception.IllegalArgument);
        });
    }

    for (const elem of [ 'wA', 'bq' ]) {
        it('Error for castling (chess960) with ' + elem, () => {
            const p = new Position('chess960', 123);
            assert.throws(() => p.castling(elem), exception.IllegalArgument);
            assert.throws(() => p.effectiveCastling(elem), exception.IllegalArgument);
        });
    }
});


describe('Position setters', () => {

    function testCastlingEnPassantFEN(position, expectedCastling, expectedEnPassant, expectedFEN) {
        assert.deepEqual(dumpCastlingFlags(position, (p, castle) => p.castling(castle)), expectedCastling);
        assert.deepEqual(position.enPassant(), expectedEnPassant);
        assert.deepEqual(position.fen(), expectedFEN);
    }

    it('Scenario 1', () => {
        const p = new Position('start');
        testCastlingEnPassantFEN(p, 'KQkq', '-', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        p.square('a8', '-');
        testCastlingEnPassantFEN(p, 'KQkq', '-', '1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQk - 0 1');
        p.square('f6', 'wb');
        testCastlingEnPassantFEN(p, 'KQkq', '-', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w KQk - 0 1');
        p.turn('w');
        testCastlingEnPassantFEN(p, 'KQkq', '-', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w KQk - 0 1');
        p.castling('wk', false);
        testCastlingEnPassantFEN(p, 'Qkq', '-', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qk - 0 1');
        p.castling('bk', true);
        testCastlingEnPassantFEN(p, 'Qkq', '-', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qk - 0 1');
        p.castling('bq', true);
        testCastlingEnPassantFEN(p, 'Qkq', '-', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qk - 0 1');
        p.enPassant('e');
        testCastlingEnPassantFEN(p, 'Qkq', 'e', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qk - 0 1');
        p.enPassant('-');
        testCastlingEnPassantFEN(p, 'Qkq', '-', '1nbqkbnr/pppppppp/5B2/8/8/8/PPPPPPPP/RNBQKBNR w Qk - 0 1');
    });

    it('Scenario 2', () => {
        const p = new Position('empty');
        testCastlingEnPassantFEN(p, '-', '-', '8/8/8/8/8/8/8/8 w - - 0 1');
        p.square('c3', 'bk');
        testCastlingEnPassantFEN(p, '-', '-', '8/8/8/8/8/2k5/8/8 w - - 0 1');
        p.square('g5', 'wk');
        testCastlingEnPassantFEN(p, '-', '-', '8/8/8/6K1/8/2k5/8/8 w - - 0 1');
        p.square('c3', '-');
        testCastlingEnPassantFEN(p, '-', '-', '8/8/8/6K1/8/8/8/8 w - - 0 1');
        p.turn('b');
        testCastlingEnPassantFEN(p, '-', '-', '8/8/8/6K1/8/8/8/8 b - - 0 1');
        p.castling('wq', false);
        testCastlingEnPassantFEN(p, '-', '-', '8/8/8/6K1/8/8/8/8 b - - 0 1');
        p.square('e8', 'bk');
        p.square('a8', 'br');
        testCastlingEnPassantFEN(p, '-', '-', 'r3k3/8/8/6K1/8/8/8/8 b - - 0 1');
        p.castling('bq', true);
        testCastlingEnPassantFEN(p, 'q', '-', 'r3k3/8/8/6K1/8/8/8/8 b q - 0 1');
        p.castling('bk', true);
        testCastlingEnPassantFEN(p, 'kq', '-', 'r3k3/8/8/6K1/8/8/8/8 b q - 0 1');
        p.enPassant('a');
        testCastlingEnPassantFEN(p, 'kq', 'a', 'r3k3/8/8/6K1/8/8/8/8 b q - 0 1');
        p.enPassant('h');
        testCastlingEnPassantFEN(p, 'kq', 'h', 'r3k3/8/8/6K1/8/8/8/8 b q - 0 1');
    });

    it('Scenario 3 (Chess960)', () => {
        const p = new Position('chess960', 763);
        testCastlingEnPassantFEN(p, 'AFaf', '-', 'rknnbrqb/pppppppp/8/8/8/8/PPPPPPPP/RKNNBRQB w AFaf - 0 1');
        p.castling('wa', false);
        testCastlingEnPassantFEN(p, 'Faf', '-', 'rknnbrqb/pppppppp/8/8/8/8/PPPPPPPP/RKNNBRQB w Faf - 0 1');
        p.castling('wh', true);
        testCastlingEnPassantFEN(p, 'FHaf', '-', 'rknnbrqb/pppppppp/8/8/8/8/PPPPPPPP/RKNNBRQB w Faf - 0 1');
        p.castling('bd', true);
        testCastlingEnPassantFEN(p, 'FHadf', '-', 'rknnbrqb/pppppppp/8/8/8/8/PPPPPPPP/RKNNBRQB w Faf - 0 1');
        p.castling('wh', false);
        testCastlingEnPassantFEN(p, 'Fadf', '-', 'rknnbrqb/pppppppp/8/8/8/8/PPPPPPPP/RKNNBRQB w Faf - 0 1');
    });

    for (const elem of [ 'p', 'Q', 'kw' ]) {
        it('Error for board with colored piece ' + elem, () => {
            const p = new Position();
            assert.throws(() => p.square('d4', elem), exception.IllegalArgument);
        });
    }

    for (const elem of [ '', 'W', 'bb', 'wb' ]) {
        it('Error for turn with ' + (elem === '' ? '<empty string>' : elem), () => {
            const p = new Position();
            assert.throws(() => p.turn(elem), exception.IllegalArgument);
        });
    }

    for (const elem of [ 0, 1, 'false', 'true' ]) {
        it('Error for set castling with ' + (elem === '' ? '<empty string>' : elem), () => {
            const p = new Position();
            assert.throws(() => p.castling('wk', elem), exception.IllegalArgument);
        });
    }

    for (const elem of [ '', 'i', 'gg', 'abcdefgh' ]) {
        it('Error for en-passant with ' + (elem === '' ? '<empty string>' : elem), () => {
            const p = new Position();
            assert.throws(() => p.enPassant(elem), exception.IllegalArgument);
        });
    }
});


describe('Position equality', () => {

    function checkIsEqual(p1, p2, expected) {
        assert.deepEqual(Position.isEqual(p1, p2), expected);
        assert.deepEqual(Position.isEqual(p2, p1), expected);
    }

    it('On copy (base)', () => {
        const p1 = new Position();
        const p2 = new Position(p1);
        checkIsEqual(p1, p2, true);
    });
    it('On copy (FEN)', () => {
        const p1 = new Position(customFEN);
        const p2 = new Position(p1);
        checkIsEqual(p1, p2, true);
    });
    it('On copy (with variant)', () => {
        const p1 = new Position('horde', customFENHorde);
        const p2 = new Position(p1);
        checkIsEqual(p1, p2, true);
    });

    function itOnBoardChange(label, square, firstValue, secondValue) {
        it('On board changed ' + label, () => {
            const p1 = new Position();
            const p2 = new Position();
            p2.square(square, firstValue);
            checkIsEqual(p1, p2, false);
            p2.square(square, secondValue);
            checkIsEqual(p1, p2, true);
        });
    }
    itOnBoardChange(1, 'b8', '-', 'bn');
    itOnBoardChange(2, 'a1', '-', 'wr');
    itOnBoardChange(3, 'e4', 'bq', '-');

    it('On turn changed', () => {
        const p1 = new Position();
        const p2 = new Position();
        p2.turn('b');
        checkIsEqual(p1, p2, false);
        p2.turn('w');
        checkIsEqual(p1, p2, true);
    });

    function itOnCastlingChange(label, castle) {
        it('On castling changed ' + label, () => {
            const p1 = new Position();
            const p2 = new Position();
            p2.castling(castle, false);
            checkIsEqual(p1, p2, false);
            p2.castling(castle, true);
            checkIsEqual(p1, p2, true);
        });
    }
    itOnCastlingChange(1, 'wk');
    itOnCastlingChange(2, 'bq');

    it('With non-equal but equivalent castling flags', () => {
        const p1 = new Position('r3k3/pppppppp/8/8/8/8/PPPPPPPP/4K2R w KQkq - 0 1');
        const p2 = new Position('r3k3/pppppppp/8/8/8/8/PPPPPPPP/4K2R w Kq - 0 1');
        checkIsEqual(p1, p2, true);
    });

    it('On en-passant changed', () => {
        const p1 = new Position(customFEN);
        const p2 = new Position(customFEN);
        p2.enPassant('-');
        checkIsEqual(p1, p2, false);
        p2.enPassant('d');
        checkIsEqual(p1, p2, true);
    });

    it('After 2-square pawn move 1', () => {
        const p1 = new Position();
        p1.play('e4');
        const p2 = new Position('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
        checkIsEqual(p1, p2, true);
    });

    it('After 2-square pawn move 2', () => {
        const p1 = new Position();
        p1.play('e4');
        p1.play('d5');
        p1.play('d4');
        const p2 = new Position();
        p2.play('d4');
        p2.play('d5');
        p2.play('e4');
        checkIsEqual(p1, p2, true);
    });

    it('After 2-square pawn move 3', () => {
        const p1 = new Position();
        p1.play('e4');
        p1.play('Nc6');
        p1.play('e5');
        p1.play('f5');
        const p2 = new Position();
        p2.play('e4');
        p2.play('f5');
        p2.play('e5');
        p2.play('Nc6');
        checkIsEqual(p1, p2, false);
    });

    it('With distinct variants', () => {
        const p1 = new Position('regular', 'empty');
        const p2 = new Position('antichess', 'empty');
        checkIsEqual(p1, p2, false);
    });

    it('With non-position objects', () => {
        const pos = new Position();
        const obj = {};
        checkIsEqual(pos, obj, false);
        checkIsEqual(obj, obj, false);
    });
});
