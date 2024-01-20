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


const { exception, MoveDescriptor, Position, isMoveDescriptor } = require('../dist/lib/index');
const test = require('unit.js');


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
	it('Status?', () => { test.value(makeDescriptor('c1', 'a3')).is(false); });
});


function testIsMoveDescriptor(descriptor) {
	test.value(descriptor).isInstanceOf(MoveDescriptor);
	test.value(isMoveDescriptor(descriptor)).is(true);
}


describe('Normal move', () => {

	function itDescriptor(label, action) {
		it(label, () => {
			const preDescriptor = makeDescriptor('b1', 'a3');
			test.value(preDescriptor.status).is('regular');
			const descriptor = preDescriptor();
			action(descriptor);
		});
	}

	itDescriptor('Is descriptor?', testIsMoveDescriptor);
	itDescriptor('Is castling?'  , descriptor => test.value(descriptor.isCastling()).is(false));
	itDescriptor('Is en-passant?', descriptor => test.value(descriptor.isEnPassant()).is(false));
	itDescriptor('Is capture?'   , descriptor => test.value(descriptor.isCapture()).is(false));
	itDescriptor('Is promotion?' , descriptor => test.value(descriptor.isPromotion()).is(false));

	itDescriptor('Square from'           , descriptor => test.value(descriptor.from()).is('b1'));
	itDescriptor('Square to'             , descriptor => test.value(descriptor.to()).is('a3'));
	itDescriptor('Color'                 , descriptor => test.value(descriptor.color()).is('w'));
	itDescriptor('Moving piece'          , descriptor => test.value(descriptor.movingPiece()).is('n'));
	itDescriptor('Moving colored piece'  , descriptor => test.value(descriptor.movingColoredPiece()).is('wn'));
	itDescriptor('Captured piece'        , descriptor => test.exception(() => descriptor.capturedPiece()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Captured colored piece', descriptor => test.exception(() => descriptor.capturedColoredPiece()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook from'             , descriptor => test.exception(() => descriptor.rookFrom()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook to'               , descriptor => test.exception(() => descriptor.rookTo()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('En-passant square'     , descriptor => test.exception(() => descriptor.enPassantSquare()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Promotion'             , descriptor => test.exception(() => descriptor.promotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Colored promotion'     , descriptor => test.exception(() => descriptor.coloredPromotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('To string'             , descriptor => test.value(descriptor.toString()).is('b1a3'));
});


describe('Normal move with capture', () => {

	function itDescriptor(label, action) {
		it(label, () => {
			const preDescriptor = makeDescriptor('c3', 'c7');
			test.value(preDescriptor.status).is('regular');
			const descriptor = preDescriptor();
			action(descriptor);
		});
	}

	itDescriptor('Is descriptor?', testIsMoveDescriptor);
	itDescriptor('Is castling?'  , descriptor => test.value(descriptor.isCastling()).is(false));
	itDescriptor('Is en-passant?', descriptor => test.value(descriptor.isEnPassant()).is(false));
	itDescriptor('Is capture?'   , descriptor => test.value(descriptor.isCapture()).is(true));
	itDescriptor('Is promotion?' , descriptor => test.value(descriptor.isPromotion()).is(false));

	itDescriptor('Square from'           , descriptor => test.value(descriptor.from()).is('c3'));
	itDescriptor('Square to'             , descriptor => test.value(descriptor.to()).is('c7'));
	itDescriptor('Color'                 , descriptor => test.value(descriptor.color()).is('w'));
	itDescriptor('Moving piece'          , descriptor => test.value(descriptor.movingPiece()).is('q'));
	itDescriptor('Moving colored piece'  , descriptor => test.value(descriptor.movingColoredPiece()).is('wq'));
	itDescriptor('Captured piece'        , descriptor => test.value(descriptor.capturedPiece()).is('q'));
	itDescriptor('Captured colored piece', descriptor => test.value(descriptor.capturedColoredPiece()).is('bq'));
	itDescriptor('Rook from'             , descriptor => test.exception(() => descriptor.rookFrom()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook to'               , descriptor => test.exception(() => descriptor.rookTo()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('En-passant square'     , descriptor => test.exception(() => descriptor.enPassantSquare()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Promotion'             , descriptor => test.exception(() => descriptor.promotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Colored promotion'     , descriptor => test.exception(() => descriptor.coloredPromotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('To string'             , descriptor => test.value(descriptor.toString()).is('c3c7'));
});


describe('Castling move', () => {

	function itDescriptor(label, action) {
		it(label, () => {
			const preDescriptor = makeDescriptor('e1', 'g1');
			test.value(preDescriptor.status).is('regular');
			const descriptor = preDescriptor();
			action(descriptor);
		});
	}

	itDescriptor('Is descriptor?', testIsMoveDescriptor);
	itDescriptor('Is castling?'  , descriptor => test.value(descriptor.isCastling()).is(true));
	itDescriptor('Is en-passant?', descriptor => test.value(descriptor.isEnPassant()).is(false));
	itDescriptor('Is capture?'   , descriptor => test.value(descriptor.isCapture()).is(false));
	itDescriptor('Is promotion?' , descriptor => test.value(descriptor.isPromotion()).is(false));

	itDescriptor('Square from'           , descriptor => test.value(descriptor.from()).is('e1'));
	itDescriptor('Square to'             , descriptor => test.value(descriptor.to()).is('g1'));
	itDescriptor('Color'                 , descriptor => test.value(descriptor.color()).is('w'));
	itDescriptor('Moving piece'          , descriptor => test.value(descriptor.movingPiece()).is('k'));
	itDescriptor('Moving colored piece'  , descriptor => test.value(descriptor.movingColoredPiece()).is('wk'));
	itDescriptor('Captured piece'        , descriptor => test.exception(() => descriptor.capturedPiece()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Captured colored piece', descriptor => test.exception(() => descriptor.capturedColoredPiece()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook from'             , descriptor => test.value(descriptor.rookFrom()).is('h1'));
	itDescriptor('Rook to'               , descriptor => test.value(descriptor.rookTo()).is('f1'));
	itDescriptor('En-passant square'     , descriptor => test.exception(() => descriptor.enPassantSquare()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Promotion'             , descriptor => test.exception(() => descriptor.promotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Colored promotion'     , descriptor => test.exception(() => descriptor.coloredPromotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('To string'             , descriptor => test.value(descriptor.toString()).is('e1g1O'));
});


describe('En-passant move', () => {

	function itDescriptor(label, action) {
		it(label, () => {
			const preDescriptor = makeDescriptor('g5', 'f6');
			test.value(preDescriptor.status).is('regular');
			const descriptor = preDescriptor();
			action(descriptor);
		});
	}

	itDescriptor('Is descriptor?', testIsMoveDescriptor);
	itDescriptor('Is castling?'  , descriptor => test.value(descriptor.isCastling()).is(false));
	itDescriptor('Is en-passant?', descriptor => test.value(descriptor.isEnPassant()).is(true));
	itDescriptor('Is capture?'   , descriptor => test.value(descriptor.isCapture()).is(true));
	itDescriptor('Is promotion?' , descriptor => test.value(descriptor.isPromotion()).is(false));

	itDescriptor('Square from'           , descriptor => test.value(descriptor.from()).is('g5'));
	itDescriptor('Square to'             , descriptor => test.value(descriptor.to()).is('f6'));
	itDescriptor('Color'                 , descriptor => test.value(descriptor.color()).is('w'));
	itDescriptor('Moving piece'          , descriptor => test.value(descriptor.movingPiece()).is('p'));
	itDescriptor('Moving colored piece'  , descriptor => test.value(descriptor.movingColoredPiece()).is('wp'));
	itDescriptor('Captured piece'        , descriptor => test.value(descriptor.capturedPiece()).is('p'));
	itDescriptor('Captured colored piece', descriptor => test.value(descriptor.capturedColoredPiece()).is('bp'));
	itDescriptor('Rook from'             , descriptor => test.exception(() => descriptor.rookFrom()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook to'               , descriptor => test.exception(() => descriptor.rookTo()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('En-passant square'     , descriptor => test.value(descriptor.enPassantSquare()).is('f5'));
	itDescriptor('Promotion'             , descriptor => test.exception(() => descriptor.promotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Colored promotion'     , descriptor => test.exception(() => descriptor.coloredPromotion()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('To string'             , descriptor => test.value(descriptor.toString()).is('g5f6'));
});


describe('Promotion move', () => {

	function itDescriptor(label, action) {
		it(label, () => {
			const preDescriptor = makeDescriptor('a7', 'a8');
			test.value(preDescriptor.status).is('promotion');
			const descriptor = preDescriptor('q');
			action(descriptor);
		});
	}

	itDescriptor('Is descriptor?', testIsMoveDescriptor);
	itDescriptor('Is castling?'  , descriptor => test.value(descriptor.isCastling()).is(false));
	itDescriptor('Is en-passant?', descriptor => test.value(descriptor.isEnPassant()).is(false));
	itDescriptor('Is capture?'   , descriptor => test.value(descriptor.isCapture()).is(false));
	itDescriptor('Is promotion?' , descriptor => test.value(descriptor.isPromotion()).is(true));

	itDescriptor('Square from'           , descriptor => test.value(descriptor.from()).is('a7'));
	itDescriptor('Square to'             , descriptor => test.value(descriptor.to()).is('a8'));
	itDescriptor('Color'                 , descriptor => test.value(descriptor.color()).is('w'));
	itDescriptor('Moving piece'          , descriptor => test.value(descriptor.movingPiece()).is('p'));
	itDescriptor('Moving colored piece'  , descriptor => test.value(descriptor.movingColoredPiece()).is('wp'));
	itDescriptor('Captured piece'        , descriptor => test.exception(() => descriptor.capturedPiece()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Captured colored piece', descriptor => test.exception(() => descriptor.capturedColoredPiece()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook from'             , descriptor => test.exception(() => descriptor.rookFrom()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook to'               , descriptor => test.exception(() => descriptor.rookTo()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('En-passant square'     , descriptor => test.exception(() => descriptor.enPassantSquare()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Promotion'             , descriptor => test.value(descriptor.promotion()).is('q'));
	itDescriptor('Colored promotion'     , descriptor => test.value(descriptor.coloredPromotion()).is('wq'));
	itDescriptor('To string'             , descriptor => test.value(descriptor.toString()).is('a7a8Q'));
});


describe('Promotion move with capture', () => {

	function itDescriptor(label, action) {
		it(label, () => {
			const preDescriptor = makeDescriptor('a7', 'b8');
			test.value(preDescriptor.status).is('promotion');
			const descriptor = preDescriptor('r');
			action(descriptor);
		});
	}

	itDescriptor('Is descriptor?', testIsMoveDescriptor);
	itDescriptor('Is castling?'  , descriptor => test.value(descriptor.isCastling()).is(false));
	itDescriptor('Is en-passant?', descriptor => test.value(descriptor.isEnPassant()).is(false));
	itDescriptor('Is capture?'   , descriptor => test.value(descriptor.isCapture()).is(true));
	itDescriptor('Is promotion?' , descriptor => test.value(descriptor.isPromotion()).is(true));

	itDescriptor('Square from'           , descriptor => test.value(descriptor.from()).is('a7'));
	itDescriptor('Square to'             , descriptor => test.value(descriptor.to()).is('b8'));
	itDescriptor('Color'                 , descriptor => test.value(descriptor.color()).is('w'));
	itDescriptor('Moving piece'          , descriptor => test.value(descriptor.movingPiece()).is('p'));
	itDescriptor('Moving colored piece'  , descriptor => test.value(descriptor.movingColoredPiece()).is('wp'));
	itDescriptor('Captured piece'        , descriptor => test.value(descriptor.capturedPiece()).is('n'));
	itDescriptor('Captured colored piece', descriptor => test.value(descriptor.capturedColoredPiece()).is('bn'));
	itDescriptor('Rook from'             , descriptor => test.exception(() => descriptor.rookFrom()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Rook to'               , descriptor => test.exception(() => descriptor.rookTo()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('En-passant square'     , descriptor => test.exception(() => descriptor.enPassantSquare()).isInstanceOf(exception.IllegalArgument));
	itDescriptor('Promotion'             , descriptor => test.value(descriptor.promotion()).is('r'));
	itDescriptor('Colored promotion'     , descriptor => test.value(descriptor.coloredPromotion()).is('wr'));
	itDescriptor('To string'             , descriptor => test.value(descriptor.toString()).is('a7b8R'));
});
