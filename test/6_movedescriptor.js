/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2021  Yoann Le Montagner <yo35 -at- melix.net>       *
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
 ******************************************************************************/


'use strict';


var kokopu = require('../src/index');
var test = require('unit.js');


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

	var position = new kokopu.Position('1nb1k1nr/Ppqp3p/4p3/5pP1/8/2Q5/1P1PPP1P/RNB1K2R w K f6 0 1');
	return position.isMoveLegal(from, to);
}


describe('Illegal move', function() {
	it('Status?', function() { test.value(makeDescriptor('c1', 'a3')).is(false); });
});


describe('Normal move', function() {
	var preDescriptor = makeDescriptor('b1', 'a3');

	it('Status?', function() { test.value(preDescriptor.status).is('regular'); });
	var descriptor = preDescriptor();

	it('Is descriptor?', function() { test.value(kokopu.isMoveDescriptor(descriptor)).is(true); });
	it('Is castling?'  , function() { test.value(descriptor.isCastling()).is(false); });
	it('Is en-passant?', function() { test.value(descriptor.isEnPassant()).is(false); });
	it('Is capture?'   , function() { test.value(descriptor.isCapture()).is(false); });
	it('Is promotion?' , function() { test.value(descriptor.isPromotion()).is(false); });

	it('Square from'           , function() { test.value(descriptor.from()).is('b1'); });
	it('Square to'             , function() { test.value(descriptor.to()).is('a3'); });
	it('Color'                 , function() { test.value(descriptor.color()).is('w'); });
	it('Moving piece'          , function() { test.value(descriptor.movingPiece()).is('n'); });
	it('Moving colored piece'  , function() { test.value(descriptor.movingColoredPiece()).is('wn'); });
	it('Captured piece'        , function() { test.exception(function() { descriptor.capturedPiece(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Captured colored piece', function() { test.exception(function() { descriptor.capturedColoredPiece(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook from'             , function() { test.exception(function() { descriptor.rookFrom(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook to'               , function() { test.exception(function() { descriptor.rookTo(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('En-passant square'     , function() { test.exception(function() { descriptor.enPassantSquare(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Promotion'             , function() { test.exception(function() { descriptor.promotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Colored promotion'     , function() { test.exception(function() { descriptor.coloredPromotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('To string'             , function() { test.value(descriptor.toString()).is('b1a3'); });
});


describe('Normal move with capture', function() {
	var preDescriptor = makeDescriptor('c3', 'c7');

	it('Status?', function() { test.value(preDescriptor.status).is('regular'); });
	var descriptor = preDescriptor();

	it('Is descriptor?', function() { test.value(kokopu.isMoveDescriptor(descriptor)).is(true); });
	it('Is castling?'  , function() { test.value(descriptor.isCastling()).is(false); });
	it('Is en-passant?', function() { test.value(descriptor.isEnPassant()).is(false); });
	it('Is capture?'   , function() { test.value(descriptor.isCapture()).is(true); });
	it('Is promotion?' , function() { test.value(descriptor.isPromotion()).is(false); });

	it('Square from'           , function() { test.value(descriptor.from()).is('c3'); });
	it('Square to'             , function() { test.value(descriptor.to()).is('c7'); });
	it('Color'                 , function() { test.value(descriptor.color()).is('w'); });
	it('Moving piece'          , function() { test.value(descriptor.movingPiece()).is('q'); });
	it('Moving colored piece'  , function() { test.value(descriptor.movingColoredPiece()).is('wq'); });
	it('Captured piece'        , function() { test.value(descriptor.capturedPiece()).is('q'); });
	it('Captured colored piece', function() { test.value(descriptor.capturedColoredPiece()).is('bq'); });
	it('Rook from'             , function() { test.exception(function() { descriptor.rookFrom(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook to'               , function() { test.exception(function() { descriptor.rookTo(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('En-passant square'     , function() { test.exception(function() { descriptor.enPassantSquare(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Promotion'             , function() { test.exception(function() { descriptor.promotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Colored promotion'     , function() { test.exception(function() { descriptor.coloredPromotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('To string'             , function() { test.value(descriptor.toString()).is('c3c7'); });
});


describe('Castling move', function() {
	var preDescriptor = makeDescriptor('e1', 'g1');

	it('Status?', function() { test.value(preDescriptor.status).is('regular'); });
	var descriptor = preDescriptor();

	it('Is descriptor?', function() { test.value(kokopu.isMoveDescriptor(descriptor)).is(true); });
	it('Is castling?'  , function() { test.value(descriptor.isCastling()).is(true); });
	it('Is en-passant?', function() { test.value(descriptor.isEnPassant()).is(false); });
	it('Is capture?'   , function() { test.value(descriptor.isCapture()).is(false); });
	it('Is promotion?' , function() { test.value(descriptor.isPromotion()).is(false); });

	it('Square from'           , function() { test.value(descriptor.from()).is('e1'); });
	it('Square to'             , function() { test.value(descriptor.to()).is('g1'); });
	it('Color'                 , function() { test.value(descriptor.color()).is('w'); });
	it('Moving piece'          , function() { test.value(descriptor.movingPiece()).is('k'); });
	it('Moving colored piece'  , function() { test.value(descriptor.movingColoredPiece()).is('wk'); });
	it('Captured piece'        , function() { test.exception(function() { descriptor.capturedPiece(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Captured colored piece', function() { test.exception(function() { descriptor.capturedColoredPiece(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook from'             , function() { test.value(descriptor.rookFrom()).is('h1'); });
	it('Rook to'               , function() { test.value(descriptor.rookTo()).is('f1'); });
	it('En-passant square'     , function() { test.exception(function() { descriptor.enPassantSquare(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Promotion'             , function() { test.exception(function() { descriptor.promotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Colored promotion'     , function() { test.exception(function() { descriptor.coloredPromotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('To string'             , function() { test.value(descriptor.toString()).is('e1g1O'); });
});


describe('En-passant move', function() {
	var preDescriptor = makeDescriptor('g5', 'f6');

	it('Status?', function() { test.value(preDescriptor.status).is('regular'); });
	var descriptor = preDescriptor();

	it('Is descriptor?', function() { test.value(kokopu.isMoveDescriptor(descriptor)).is(true); });
	it('Is castling?'  , function() { test.value(descriptor.isCastling()).is(false); });
	it('Is en-passant?', function() { test.value(descriptor.isEnPassant()).is(true); });
	it('Is capture?'   , function() { test.value(descriptor.isCapture()).is(true); });
	it('Is promotion?' , function() { test.value(descriptor.isPromotion()).is(false); });

	it('Square from'           , function() { test.value(descriptor.from()).is('g5'); });
	it('Square to'             , function() { test.value(descriptor.to()).is('f6'); });
	it('Color'                 , function() { test.value(descriptor.color()).is('w'); });
	it('Moving piece'          , function() { test.value(descriptor.movingPiece()).is('p'); });
	it('Moving colored piece'  , function() { test.value(descriptor.movingColoredPiece()).is('wp'); });
	it('Captured piece'        , function() { test.value(descriptor.capturedPiece()).is('p'); });
	it('Captured colored piece', function() { test.value(descriptor.capturedColoredPiece()).is('bp'); });
	it('Rook from'             , function() { test.exception(function() { descriptor.rookFrom(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook to'               , function() { test.exception(function() { descriptor.rookTo(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('En-passant square'     , function() { test.value(descriptor.enPassantSquare()).is('f5'); });
	it('Promotion'             , function() { test.exception(function() { descriptor.promotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Colored promotion'     , function() { test.exception(function() { descriptor.coloredPromotion(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('To string'             , function() { test.value(descriptor.toString()).is('g5f6'); });
});


describe('Promotion move', function() {
	var preDescriptor = makeDescriptor('a7', 'a8');

	it('Status?', function() { test.value(preDescriptor.status).is('promotion'); });
	var descriptor = preDescriptor('q');

	it('Is descriptor?', function() { test.value(kokopu.isMoveDescriptor(descriptor)).is(true); });
	it('Is castling?'  , function() { test.value(descriptor.isCastling()).is(false); });
	it('Is en-passant?', function() { test.value(descriptor.isEnPassant()).is(false); });
	it('Is capture?'   , function() { test.value(descriptor.isCapture()).is(false); });
	it('Is promotion?' , function() { test.value(descriptor.isPromotion()).is(true); });

	it('Square from'           , function() { test.value(descriptor.from()).is('a7'); });
	it('Square to'             , function() { test.value(descriptor.to()).is('a8'); });
	it('Color'                 , function() { test.value(descriptor.color()).is('w'); });
	it('Moving piece'          , function() { test.value(descriptor.movingPiece()).is('p'); });
	it('Moving colored piece'  , function() { test.value(descriptor.movingColoredPiece()).is('wp'); });
	it('Captured piece'        , function() { test.exception(function() { descriptor.capturedPiece(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Captured colored piece', function() { test.exception(function() { descriptor.capturedColoredPiece(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook from'             , function() { test.exception(function() { descriptor.rookFrom(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook to'               , function() { test.exception(function() { descriptor.rookTo(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('En-passant square'     , function() { test.exception(function() { descriptor.enPassantSquare(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Promotion'             , function() { test.value(descriptor.promotion()).is('q'); });
	it('Colored promotion'     , function() { test.value(descriptor.coloredPromotion()).is('wq'); });
	it('To string'             , function() { test.value(descriptor.toString()).is('a7a8Q'); });
});


describe('Promotion move with capture', function() {
	var preDescriptor = makeDescriptor('a7', 'b8');

	it('Status?', function() { test.value(preDescriptor.status).is('promotion'); });
	var descriptor = preDescriptor('r');

	it('Is descriptor?', function() { test.value(kokopu.isMoveDescriptor(descriptor)).is(true); });
	it('Is castling?'  , function() { test.value(descriptor.isCastling()).is(false); });
	it('Is en-passant?', function() { test.value(descriptor.isEnPassant()).is(false); });
	it('Is capture?'   , function() { test.value(descriptor.isCapture()).is(true); });
	it('Is promotion?' , function() { test.value(descriptor.isPromotion()).is(true); });

	it('Square from'           , function() { test.value(descriptor.from()).is('a7'); });
	it('Square to'             , function() { test.value(descriptor.to()).is('b8'); });
	it('Color'                 , function() { test.value(descriptor.color()).is('w'); });
	it('Moving piece'          , function() { test.value(descriptor.movingPiece()).is('p'); });
	it('Moving colored piece'  , function() { test.value(descriptor.movingColoredPiece()).is('wp'); });
	it('Captured piece'        , function() { test.value(descriptor.capturedPiece()).is('n'); });
	it('Captured colored piece', function() { test.value(descriptor.capturedColoredPiece()).is('bn'); });
	it('Rook from'             , function() { test.exception(function() { descriptor.rookFrom(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Rook to'               , function() { test.exception(function() { descriptor.rookTo(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('En-passant square'     , function() { test.exception(function() { descriptor.enPassantSquare(); }).isInstanceOf(kokopu.exception.IllegalArgument); });
	it('Promotion'             , function() { test.value(descriptor.promotion()).is('r'); });
	it('Colored promotion'     , function() { test.value(descriptor.coloredPromotion()).is('wr'); });
	it('To string'             , function() { test.value(descriptor.toString()).is('a7b8R'); });
});
