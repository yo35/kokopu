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


describe('Invalid argument exception', function() {
	it('Constructor', function() {
		var e = new kokopu.exception.IllegalArgument('MyFunction');
		test.value(e.functionName).is('MyFunction');
		test.value(e.toString()).is('Illegal argument in function MyFunction');
	});
});


describe('Invalid FEN exception', function() {

	function testInvalidFEN(e, expectedFEN, expectedMessage) {
		test.value(e.fen).is(expectedFEN);
		test.value(e.message).is(expectedMessage);
		test.value(e.toString()).is('InvalidFEN -> ' + expectedMessage);
	}

	it('No-argument message', function() {
		var e = new kokopu.exception.InvalidFEN('not a FEN string', kokopu.i18n.WRONG_NUMBER_OF_FEN_FIELDS);
		testInvalidFEN(e, 'not a FEN string', 'A FEN string must contain exactly 6 space-separated fields.');
	});
	it('1-argument message', function() {
		var e = new kokopu.exception.InvalidFEN('2x5/8/8/8/8/8/8/8 w - - 0 1', kokopu.i18n.UNEXPECTED_CHARACTER_IN_BOARD_FIELD, 'x');
		testInvalidFEN(e, '2x5/8/8/8/8/8/8/8 w - - 0 1', 'Unexpected character in the 1st field of the FEN string: `x`.');
	});
	it('Ill-formed message', function() {
		var e = new kokopu.exception.InvalidFEN('whatever', 'arg1={1} arg0={0} arg0={0} arg2={2} arg1={1}', 'zero', 'one');
		testInvalidFEN(e, 'whatever', 'arg1=one arg0=zero arg0=zero arg2={2} arg1=one');
	});
});


describe('Invalid notation exception', function() {

	function testInvalidNotation(e, expectedFEN, expectedNotation, expectedMessage) {
		test.value(e.fen).is(expectedFEN);
		test.value(e.notation).is(expectedNotation);
		test.value(e.message).is(expectedMessage);
		test.value(e.toString()).is('InvalidNotation -> ' + expectedMessage);
	}

	it('No-argument message', function() {
		var e = new kokopu.exception.InvalidNotation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'NotAMove', kokopu.i18n.INVALID_MOVE_NOTATION_SYNTAX);
		testInvalidNotation(e, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'NotAMove', 'The syntax of the move notation is invalid.');
	});
	it('1-argument message', function() {
		var e = new kokopu.exception.InvalidNotation('8/8/8/8/8/8/8/8 w - - 0 1', 'Zb5', kokopu.i18n.INVALID_PIECE_SYMBOL, 'Z');
		testInvalidNotation(e, '8/8/8/8/8/8/8/8 w - - 0 1', 'Zb5', 'Character `Z` is not a valid piece symbol.');
	});
	it('2-argument message', function() {
		var e = new kokopu.exception.InvalidNotation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Nxe4', kokopu.i18n.NO_PIECE_CAN_MOVE_TO, 'N', 'e4');
		testInvalidNotation(e, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Nxe4', 'No N can move to e4.');
	});
	it('Ill-formed message', function() {
		var e = new kokopu.exception.InvalidNotation('fen', 'move', 'arg1={1} arg0={0}');
		testInvalidNotation(e, 'fen', 'move', 'arg1={1} arg0={0}');
	});
});


describe('Invalid PGN exception', function() {

	function testInvalidPGN(e, expectedPGN, expectedIndex, expectedLineNumber, expectedMessagePrefix, expectedMessage) {
		test.value(e.pgn).is(expectedPGN);
		test.value(e.index).is(expectedIndex);
		test.value(e.lineNumber).is(expectedLineNumber);
		test.value(e.message).is(expectedMessage);
		test.value(e.toString()).is('InvalidPGN -> ' + expectedMessagePrefix + ' ' + expectedMessage);
	}

	it('No-argument message', function() {
		var e = new kokopu.exception.InvalidPGN('some PGN string', 0, 1, kokopu.i18n.INVALID_PGN_TOKEN);
		testInvalidPGN(e, 'some PGN string', 0, 1, '[character=0 line=1]', 'Unrecognized character or group of characters.');
	});
	it('1-argument message', function() {
		var e = new kokopu.exception.InvalidPGN('another PGN string', 10, 3, kokopu.i18n.UNKNOWN_VARIANT, 'not-a-variant');
		testInvalidPGN(e, 'another PGN string', 10, 3, '[character=10 line=3]', 'Unknown chess game variant (not-a-variant).');
	});
	it('2-argument message', function() {
		var e = new kokopu.exception.InvalidPGN('another PGN string again', 45678, 294, kokopu.i18n.INVALID_GAME_INDEX, 13, 9);
		testInvalidPGN(e, 'another PGN string again', 45678, 294, '[character=45678 line=294]', 'Game index 13 is invalid (only 9 game(s) found in the PGN data).');
	});
	it('Ill-formed message', function() {
		var e = new kokopu.exception.InvalidPGN('whatever', 0, 1, 'arg0={0} arg1={1}', '{1}', '{0}');
		testInvalidPGN(e, 'whatever', 0, 1, '[character=0 line=1]', 'arg0={1} arg1={0}');
	});
});
