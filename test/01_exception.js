/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2025  Yoann Le Montagner <yo35 -at- melix.net>       *
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


const { exception, i18n } = require('../dist/lib/index');
const test = require('unit.js');


describe('Invalid argument exception', () => {
    it('Constructor', () => {
        const e = new exception.IllegalArgument('MyFunction');
        test.value(e.functionName).is('MyFunction');
        test.value(e.toString()).is('Illegal argument in function MyFunction');
    });
});


describe('Invalid FEN exception', () => {

    function testInvalidFEN(e, expectedFEN, expectedMessage) {
        test.value(e.fen).is(expectedFEN);
        test.value(e.message).is(expectedMessage);
        test.value(e.toString()).is('InvalidFEN -> ' + expectedMessage);
    }

    it('No-argument message', () => {
        const e = new exception.InvalidFEN('not a FEN string', i18n.WRONG_NUMBER_OF_FEN_FIELDS);
        testInvalidFEN(e, 'not a FEN string', 'A FEN string must contain exactly 6 space-separated fields.');
    });
    it('1-argument message', () => {
        const e = new exception.InvalidFEN('2x5/8/8/8/8/8/8/8 w - - 0 1', i18n.UNEXPECTED_CHARACTER_IN_BOARD_FIELD, 'x');
        testInvalidFEN(e, '2x5/8/8/8/8/8/8/8 w - - 0 1', 'Unexpected character in the 1st field of the FEN string: `x`.');
    });
    it('Ill-formed message', () => {
        const e = new exception.InvalidFEN('whatever', 'arg1={1} arg0={0} arg0={0} arg2={2} arg1={1}', 'zero', 'one');
        testInvalidFEN(e, 'whatever', 'arg1=one arg0=zero arg0=zero arg2={2} arg1=one');
    });
});


describe('Invalid notation exception', () => {

    function testInvalidNotation(e, expectedFEN, expectedNotation, expectedMessage) {
        test.value(e.fen).is(expectedFEN);
        test.value(e.notation).is(expectedNotation);
        test.value(e.message).is(expectedMessage);
        test.value(e.toString()).is('InvalidNotation -> ' + expectedMessage);
    }

    it('No-argument message', () => {
        const e = new exception.InvalidNotation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'NotAMove', i18n.INVALID_MOVE_NOTATION_SYNTAX);
        testInvalidNotation(e, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'NotAMove', 'The syntax of the move notation is invalid.');
    });
    it('1-argument message', () => {
        const e = new exception.InvalidNotation('8/8/8/8/8/8/8/8 w - - 0 1', 'Zb5', i18n.INVALID_PIECE_SYMBOL, 'Z');
        testInvalidNotation(e, '8/8/8/8/8/8/8/8 w - - 0 1', 'Zb5', 'Character `Z` is not a valid piece symbol.');
    });
    it('2-argument message', () => {
        const e = new exception.InvalidNotation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Nxe4', i18n.NO_PIECE_CAN_MOVE_TO, 'N', 'e4');
        testInvalidNotation(e, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Nxe4', 'No N can move to e4.');
    });
    it('Ill-formed message', () => {
        const e = new exception.InvalidNotation('fen', 'move', 'arg1={1} arg0={0}');
        testInvalidNotation(e, 'fen', 'move', 'arg1={1} arg0={0}');
    });
});


describe('Invalid PGN exception', () => {

    function testInvalidPGN(e, expectedPGN, expectedIndex, expectedLineNumber, expectedMessagePrefix, expectedMessage) {
        test.value(e.pgn).is(expectedPGN);
        test.value(e.index).is(expectedIndex);
        test.value(e.lineNumber).is(expectedLineNumber);
        test.value(e.message).is(expectedMessage);
        test.value(e.toString()).is('InvalidPGN -> ' + expectedMessagePrefix + ' ' + expectedMessage);
    }

    it('No-argument message', () => {
        const e = new exception.InvalidPGN('some PGN string', 0, 1, i18n.INVALID_PGN_TOKEN);
        testInvalidPGN(e, 'some PGN string', 0, 1, '[character=0 line=1]', 'Unrecognized character or group of characters.');
    });
    it('1-argument message', () => {
        const e = new exception.InvalidPGN('another PGN string', 10, 3, i18n.UNKNOWN_VARIANT, 'not-a-variant');
        testInvalidPGN(e, 'another PGN string', 10, 3, '[character=10 line=3]', 'Unknown chess game variant (not-a-variant).');
    });
    it('2-argument message', () => {
        const e = new exception.InvalidPGN('another PGN string again', 45678, 294, i18n.INVALID_GAME_INDEX, 13, 9);
        testInvalidPGN(e, 'another PGN string again', 45678, 294, '[character=45678 line=294]', 'Game index 13 is invalid (only 9 game(s) found in the PGN data).');
    });
    it('Ill-formed message', () => {
        const e = new exception.InvalidPGN('whatever', 0, 1, 'arg0={0} arg1={1}', '{1}', '{0}');
        testInvalidPGN(e, 'whatever', 0, 1, '[character=0 line=1]', 'arg0={1} arg1={0}');
    });
});


describe('Invalid POJO exception', () => {

    function testInvalidPOJO(e, expectedPOJO, expectedFieldName, expectedMessage) {
        test.value(e.pojo).is(expectedPOJO);
        test.value(e.fieldName).is(expectedFieldName);
        test.value(e.message).is(expectedMessage);
        test.value(e.toString()).is('InvalidPOJO -> ' + expectedMessage);
    }

    it('No-argument message', () => {
        const e = new exception.InvalidPOJO({}, 'white.name', i18n.INVALID_POJO_STRING_FIELD);
        testInvalidPOJO(e, {}, 'white.name', 'Invalid value (must be a string).');
    });
    it('1-argument message', () => {
        const e = new exception.InvalidPOJO({ a: 42 }, 'initialPosition[0]', i18n.INVALID_FEN_IN_POJO, '<the ill-formed FEN>');
        testInvalidPOJO(e, { a: 42 }, 'initialPosition[0]', 'Invalid initial position FEN. <the ill-formed FEN>');
    });
    it('Ill-formed message', () => {
        const e = new exception.InvalidPOJO('whatever', '', 'arg1={1} arg0={0} arg0={0} arg2={2} arg1={1}', 'zero', 'one');
        testInvalidPOJO(e, 'whatever', '', 'arg1=one arg0=zero arg0=zero arg2={2} arg1=one');
    });
});
