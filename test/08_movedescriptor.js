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


const { exception, MoveDescriptor, Position, isMoveDescriptor } = require('../dist/lib/index');
const assert = require('node:assert/strict');


function makeDescriptor(from, to) {

    // +---+---+---+---+---+---+---+---+
    // |   | n | b |   | k |   | n | r |
    // +---+---+---+---+---+---+---+---+
    // | P | p | q | p |   |   |   | p |
    // +---+---+---+---+---+---+---+---+
    // |   |   |   |   | p |   |   |   |
    // +---+---+---+---+---+---+---+---+
    // |   |   |   |   |   | p | P |   |
    // +---+---+---+---+---+---+---+---+
    // |   |   |   |   |   |   |   |   |
    // +---+---+---+---+---+---+---+---+
    // |   |   | Q |   |   |   |   |   |
    // +---+---+---+---+---+---+---+---+
    // |   | P |   |   | P | P |   | P |
    // +---+---+---+---+---+---+---+---+
    // | R | N | B |   | K |   |   | R |
    // +---+---+---+---+---+---+---+---+
    // w K f6

    const position = new Position('1nb1k1nr/Ppqp3p/4p3/5pP1/8/2Q5/1P1PPP1P/RNB1K2R w K f6 0 1');
    return position.isMoveLegal(from, to);
}


describe('Illegal move', () => {
    it('Status?', () => { assert.deepEqual(makeDescriptor('c1', 'a3'), false); });
});


function testIsMoveDescriptor(descriptor) {
    assert(descriptor instanceof MoveDescriptor);
    assert.deepEqual(isMoveDescriptor(descriptor), true);
}


describe('Normal move', () => {

    function itDescriptor(label, action) {
        it(label, () => {
            const preDescriptor = makeDescriptor('b1', 'a3');
            assert.deepEqual(preDescriptor.status, 'regular');
            const descriptor = preDescriptor();
            action(descriptor);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    itDescriptor('Is descriptor?', testIsMoveDescriptor);
    itDescriptor('Is castling?'  , descriptor => assert.deepEqual(descriptor.isCastling(), false));
    itDescriptor('Is en-passant?', descriptor => assert.deepEqual(descriptor.isEnPassant(), false));
    itDescriptor('Is capture?'   , descriptor => assert.deepEqual(descriptor.isCapture(), false));
    itDescriptor('Is promotion?' , descriptor => assert.deepEqual(descriptor.isPromotion(), false));

    itDescriptor('Square from'           , descriptor => assert.deepEqual(descriptor.from(), 'b1'));
    itDescriptor('Square to'             , descriptor => assert.deepEqual(descriptor.to(), 'a3'));
    itDescriptor('Color'                 , descriptor => assert.deepEqual(descriptor.color(), 'w'));
    itDescriptor('Moving piece'          , descriptor => assert.deepEqual(descriptor.movingPiece(), 'n'));
    itDescriptor('Moving colored piece'  , descriptor => assert.deepEqual(descriptor.movingColoredPiece(), 'wn'));
    itDescriptor('Captured piece'        , descriptor => assert.throws(() => descriptor.capturedPiece(), exception.IllegalArgument));
    itDescriptor('Captured colored piece', descriptor => assert.throws(() => descriptor.capturedColoredPiece(), exception.IllegalArgument));
    itDescriptor('Rook from'             , descriptor => assert.throws(() => descriptor.rookFrom(), exception.IllegalArgument));
    itDescriptor('Rook to'               , descriptor => assert.throws(() => descriptor.rookTo(), exception.IllegalArgument));
    itDescriptor('En-passant square'     , descriptor => assert.throws(() => descriptor.enPassantSquare(), exception.IllegalArgument));
    itDescriptor('Promotion'             , descriptor => assert.throws(() => descriptor.promotion(), exception.IllegalArgument));
    itDescriptor('Colored promotion'     , descriptor => assert.throws(() => descriptor.coloredPromotion(), exception.IllegalArgument));
    itDescriptor('To string'             , descriptor => assert.deepEqual(descriptor.toString(), 'b1a3'));

    /* eslint-enable */
});


describe('Normal move with capture', () => {

    function itDescriptor(label, action) {
        it(label, () => {
            const preDescriptor = makeDescriptor('c3', 'c7');
            assert.deepEqual(preDescriptor.status, 'regular');
            const descriptor = preDescriptor();
            action(descriptor);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    itDescriptor('Is descriptor?', testIsMoveDescriptor);
    itDescriptor('Is castling?'  , descriptor => assert.deepEqual(descriptor.isCastling(), false));
    itDescriptor('Is en-passant?', descriptor => assert.deepEqual(descriptor.isEnPassant(), false));
    itDescriptor('Is capture?'   , descriptor => assert.deepEqual(descriptor.isCapture(), true));
    itDescriptor('Is promotion?' , descriptor => assert.deepEqual(descriptor.isPromotion(), false));

    itDescriptor('Square from'           , descriptor => assert.deepEqual(descriptor.from(), 'c3'));
    itDescriptor('Square to'             , descriptor => assert.deepEqual(descriptor.to(), 'c7'));
    itDescriptor('Color'                 , descriptor => assert.deepEqual(descriptor.color(), 'w'));
    itDescriptor('Moving piece'          , descriptor => assert.deepEqual(descriptor.movingPiece(), 'q'));
    itDescriptor('Moving colored piece'  , descriptor => assert.deepEqual(descriptor.movingColoredPiece(), 'wq'));
    itDescriptor('Captured piece'        , descriptor => assert.deepEqual(descriptor.capturedPiece(), 'q'));
    itDescriptor('Captured colored piece', descriptor => assert.deepEqual(descriptor.capturedColoredPiece(), 'bq'));
    itDescriptor('Rook from'             , descriptor => assert.throws(() => descriptor.rookFrom(), exception.IllegalArgument));
    itDescriptor('Rook to'               , descriptor => assert.throws(() => descriptor.rookTo(), exception.IllegalArgument));
    itDescriptor('En-passant square'     , descriptor => assert.throws(() => descriptor.enPassantSquare(), exception.IllegalArgument));
    itDescriptor('Promotion'             , descriptor => assert.throws(() => descriptor.promotion(), exception.IllegalArgument));
    itDescriptor('Colored promotion'     , descriptor => assert.throws(() => descriptor.coloredPromotion(), exception.IllegalArgument));
    itDescriptor('To string'             , descriptor => assert.deepEqual(descriptor.toString(), 'c3c7'));

    /* eslint-enable */
});


describe('Castling move', () => {

    function itDescriptor(label, action) {
        it(label, () => {
            const preDescriptor = makeDescriptor('e1', 'g1');
            assert.deepEqual(preDescriptor.status, 'regular');
            const descriptor = preDescriptor();
            action(descriptor);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    itDescriptor('Is descriptor?', testIsMoveDescriptor);
    itDescriptor('Is castling?'  , descriptor => assert.deepEqual(descriptor.isCastling(), true));
    itDescriptor('Is en-passant?', descriptor => assert.deepEqual(descriptor.isEnPassant(), false));
    itDescriptor('Is capture?'   , descriptor => assert.deepEqual(descriptor.isCapture(), false));
    itDescriptor('Is promotion?' , descriptor => assert.deepEqual(descriptor.isPromotion(), false));

    itDescriptor('Square from'           , descriptor => assert.deepEqual(descriptor.from(), 'e1'));
    itDescriptor('Square to'             , descriptor => assert.deepEqual(descriptor.to(), 'g1'));
    itDescriptor('Color'                 , descriptor => assert.deepEqual(descriptor.color(), 'w'));
    itDescriptor('Moving piece'          , descriptor => assert.deepEqual(descriptor.movingPiece(), 'k'));
    itDescriptor('Moving colored piece'  , descriptor => assert.deepEqual(descriptor.movingColoredPiece(), 'wk'));
    itDescriptor('Captured piece'        , descriptor => assert.throws(() => descriptor.capturedPiece(), exception.IllegalArgument));
    itDescriptor('Captured colored piece', descriptor => assert.throws(() => descriptor.capturedColoredPiece(), exception.IllegalArgument));
    itDescriptor('Rook from'             , descriptor => assert.deepEqual(descriptor.rookFrom(), 'h1'));
    itDescriptor('Rook to'               , descriptor => assert.deepEqual(descriptor.rookTo(), 'f1'));
    itDescriptor('En-passant square'     , descriptor => assert.throws(() => descriptor.enPassantSquare(), exception.IllegalArgument));
    itDescriptor('Promotion'             , descriptor => assert.throws(() => descriptor.promotion(), exception.IllegalArgument));
    itDescriptor('Colored promotion'     , descriptor => assert.throws(() => descriptor.coloredPromotion(), exception.IllegalArgument));
    itDescriptor('To string'             , descriptor => assert.deepEqual(descriptor.toString(), 'e1g1O'));

    /* eslint-enable */
});


describe('En-passant move', () => {

    function itDescriptor(label, action) {
        it(label, () => {
            const preDescriptor = makeDescriptor('g5', 'f6');
            assert.deepEqual(preDescriptor.status, 'regular');
            const descriptor = preDescriptor();
            action(descriptor);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    itDescriptor('Is descriptor?', testIsMoveDescriptor);
    itDescriptor('Is castling?'  , descriptor => assert.deepEqual(descriptor.isCastling(), false));
    itDescriptor('Is en-passant?', descriptor => assert.deepEqual(descriptor.isEnPassant(), true));
    itDescriptor('Is capture?'   , descriptor => assert.deepEqual(descriptor.isCapture(), true));
    itDescriptor('Is promotion?' , descriptor => assert.deepEqual(descriptor.isPromotion(), false));

    itDescriptor('Square from'           , descriptor => assert.deepEqual(descriptor.from(), 'g5'));
    itDescriptor('Square to'             , descriptor => assert.deepEqual(descriptor.to(), 'f6'));
    itDescriptor('Color'                 , descriptor => assert.deepEqual(descriptor.color(), 'w'));
    itDescriptor('Moving piece'          , descriptor => assert.deepEqual(descriptor.movingPiece(), 'p'));
    itDescriptor('Moving colored piece'  , descriptor => assert.deepEqual(descriptor.movingColoredPiece(), 'wp'));
    itDescriptor('Captured piece'        , descriptor => assert.deepEqual(descriptor.capturedPiece(), 'p'));
    itDescriptor('Captured colored piece', descriptor => assert.deepEqual(descriptor.capturedColoredPiece(), 'bp'));
    itDescriptor('Rook from'             , descriptor => assert.throws(() => descriptor.rookFrom(), exception.IllegalArgument));
    itDescriptor('Rook to'               , descriptor => assert.throws(() => descriptor.rookTo(), exception.IllegalArgument));
    itDescriptor('En-passant square'     , descriptor => assert.deepEqual(descriptor.enPassantSquare(), 'f5'));
    itDescriptor('Promotion'             , descriptor => assert.throws(() => descriptor.promotion(), exception.IllegalArgument));
    itDescriptor('Colored promotion'     , descriptor => assert.throws(() => descriptor.coloredPromotion(), exception.IllegalArgument));
    itDescriptor('To string'             , descriptor => assert.deepEqual(descriptor.toString(), 'g5f6'));

    /* eslint-enable */
});


describe('Promotion move', () => {

    function itDescriptor(label, action) {
        it(label, () => {
            const preDescriptor = makeDescriptor('a7', 'a8');
            assert.deepEqual(preDescriptor.status, 'promotion');
            const descriptor = preDescriptor('q');
            action(descriptor);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    itDescriptor('Is descriptor?', testIsMoveDescriptor);
    itDescriptor('Is castling?'  , descriptor => assert.deepEqual(descriptor.isCastling(), false));
    itDescriptor('Is en-passant?', descriptor => assert.deepEqual(descriptor.isEnPassant(), false));
    itDescriptor('Is capture?'   , descriptor => assert.deepEqual(descriptor.isCapture(), false));
    itDescriptor('Is promotion?' , descriptor => assert.deepEqual(descriptor.isPromotion(), true));

    itDescriptor('Square from'           , descriptor => assert.deepEqual(descriptor.from(), 'a7'));
    itDescriptor('Square to'             , descriptor => assert.deepEqual(descriptor.to(), 'a8'));
    itDescriptor('Color'                 , descriptor => assert.deepEqual(descriptor.color(), 'w'));
    itDescriptor('Moving piece'          , descriptor => assert.deepEqual(descriptor.movingPiece(), 'p'));
    itDescriptor('Moving colored piece'  , descriptor => assert.deepEqual(descriptor.movingColoredPiece(), 'wp'));
    itDescriptor('Captured piece'        , descriptor => assert.throws(() => descriptor.capturedPiece(), exception.IllegalArgument));
    itDescriptor('Captured colored piece', descriptor => assert.throws(() => descriptor.capturedColoredPiece(), exception.IllegalArgument));
    itDescriptor('Rook from'             , descriptor => assert.throws(() => descriptor.rookFrom(), exception.IllegalArgument));
    itDescriptor('Rook to'               , descriptor => assert.throws(() => descriptor.rookTo(), exception.IllegalArgument));
    itDescriptor('En-passant square'     , descriptor => assert.throws(() => descriptor.enPassantSquare(), exception.IllegalArgument));
    itDescriptor('Promotion'             , descriptor => assert.deepEqual(descriptor.promotion(), 'q'));
    itDescriptor('Colored promotion'     , descriptor => assert.deepEqual(descriptor.coloredPromotion(), 'wq'));
    itDescriptor('To string'             , descriptor => assert.deepEqual(descriptor.toString(), 'a7a8Q'));

    /* eslint-enable */
});


describe('Promotion move with capture', () => {

    function itDescriptor(label, action) {
        it(label, () => {
            const preDescriptor = makeDescriptor('a7', 'b8');
            assert.deepEqual(preDescriptor.status, 'promotion');
            const descriptor = preDescriptor('r');
            action(descriptor);
        });
    }

    /* eslint-disable @stylistic/comma-spacing, @stylistic/no-multi-spaces */

    itDescriptor('Is descriptor?', testIsMoveDescriptor);
    itDescriptor('Is castling?'  , descriptor => assert.deepEqual(descriptor.isCastling(), false));
    itDescriptor('Is en-passant?', descriptor => assert.deepEqual(descriptor.isEnPassant(), false));
    itDescriptor('Is capture?'   , descriptor => assert.deepEqual(descriptor.isCapture(), true));
    itDescriptor('Is promotion?' , descriptor => assert.deepEqual(descriptor.isPromotion(), true));

    itDescriptor('Square from'           , descriptor => assert.deepEqual(descriptor.from(), 'a7'));
    itDescriptor('Square to'             , descriptor => assert.deepEqual(descriptor.to(), 'b8'));
    itDescriptor('Color'                 , descriptor => assert.deepEqual(descriptor.color(), 'w'));
    itDescriptor('Moving piece'          , descriptor => assert.deepEqual(descriptor.movingPiece(), 'p'));
    itDescriptor('Moving colored piece'  , descriptor => assert.deepEqual(descriptor.movingColoredPiece(), 'wp'));
    itDescriptor('Captured piece'        , descriptor => assert.deepEqual(descriptor.capturedPiece(), 'n'));
    itDescriptor('Captured colored piece', descriptor => assert.deepEqual(descriptor.capturedColoredPiece(), 'bn'));
    itDescriptor('Rook from'             , descriptor => assert.throws(() => descriptor.rookFrom(), exception.IllegalArgument));
    itDescriptor('Rook to'               , descriptor => assert.throws(() => descriptor.rookTo(), exception.IllegalArgument));
    itDescriptor('En-passant square'     , descriptor => assert.throws(() => descriptor.enPassantSquare(), exception.IllegalArgument));
    itDescriptor('Promotion'             , descriptor => assert.deepEqual(descriptor.promotion(), 'r'));
    itDescriptor('Colored promotion'     , descriptor => assert.deepEqual(descriptor.coloredPromotion(), 'wr'));
    itDescriptor('To string'             , descriptor => assert.deepEqual(descriptor.toString(), 'a7b8R'));

    /* eslint-enable */
});
