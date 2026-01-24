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


const { exception, isColor, isPiece, isColoredPiece, isFile, isRank, isSquare, isSquareCouple, isCastle, isCastle960, isGameResult, isGameVariant, squareColor,
    squareToCoordinates, coordinatesToSquare, oppositeColor, variantWithCanonicalStartPosition, nagSymbol, isValidECO } = require('../dist/lib/index');
const readText = require('./common/readtext');
const assert = require('node:assert/strict');


function itIsType(func, validCases, invalidCases) {
    for (const validCase of validCases) {
        it(validCase, () => { assert.deepEqual(func(validCase), true); });
    }
    for (const invalidCase of invalidCases) {
        const label = `Not ${invalidCase === '' ? '<empty string>' : typeof invalidCase === 'number' ? '<number>' : String(invalidCase)}`;
        it(label, () => { assert.deepEqual(func(invalidCase), false); });
    }
}


describe('Is color', () => {
    itIsType(isColor, [ 'w', 'b' ], [ '', 42, 'x', 'W' ]);
});


describe('Is piece', () => {
    itIsType(isPiece, [ 'k', 'r', 'p' ], [ '', 42, 'a', 'R' ]);
});


describe('Is colored piece', () => {
    itIsType(isColoredPiece, [ 'wk', 'bn', 'wb', 'bp' ], [ '', 42, 'w', 'r', 'BP' ]);
});


describe('Is file', () => {
    itIsType(isFile, [ 'a', 'b', 'd', 'h' ], [ '', 2, 'i', 'r', 'D', '1' ]);
});


describe('Is rank', () => {
    itIsType(isRank, [ '1', '2', '8' ], [ '', 2, '0', '9', 'a' ]);
});


describe('Is square', () => {
    itIsType(isSquare, [ 'a1', 'b7', 'e6', 'f3', 'h8' ], [ '', 42, 'a', '3', 'E6' ]);
});


describe('Is square couple', () => {
    itIsType(isSquareCouple, [ 'a1b2', 'g6d3', 'd7d7', 'g8h7' ], [ '', 42, 'b2', 'G6D3' ]);
});


describe('Is castle', () => {
    itIsType(isCastle, [ 'wk', 'wq', 'bk', 'bq' ], [ '', 42, 'w', 'q', 'BK', 'wa' ]);
});


describe('Is castle 960', () => {
    itIsType(isCastle960, [ 'wa', 'wc', 'bg', 'bh' ], [ '', 42, 'w', 'b', 'BG', 'wk', 'bi' ]);
});


describe('Is game result', () => {
    itIsType(isGameResult, [ '1-0', '1/2-1/2', '0-1', '*' ], [ '', 42, '1--0', '0-1 ', ' *', '1-O' ]);
});


describe('Is game variant', () => {
    itIsType(isGameVariant, [ 'regular', 'chess960', 'antichess', 'horde' ], [ '', 42, 'Regular', 'fischerandom' ]);
});


describe('Square color', () => {
    it('a1', () => { assert.deepEqual(squareColor('a1'), 'b'); });
    it('h1', () => { assert.deepEqual(squareColor('h1'), 'w'); });
    it('a8', () => { assert.deepEqual(squareColor('a8'), 'w'); });
    it('h8', () => { assert.deepEqual(squareColor('h8'), 'b'); });
    it('b3', () => { assert.deepEqual(squareColor('b3'), 'w'); });
    it('b4', () => { assert.deepEqual(squareColor('b4'), 'b'); });
    it('c4', () => { assert.deepEqual(squareColor('c4'), 'w'); });
    it('f5', () => { assert.deepEqual(squareColor('f5'), 'w'); });
    it('e5', () => { assert.deepEqual(squareColor('e5'), 'b'); });
    it('e6', () => { assert.deepEqual(squareColor('e6'), 'w'); });

    it('Error with 7', () => { assert.throws(() => squareColor('7'), exception.IllegalArgument); });
    it('Error with b8g', () => { assert.throws(() => squareColor('b8g'), exception.IllegalArgument); });
});


describe('Square to coordinates', () => {
    it('a1', () => { assert.deepEqual(squareToCoordinates('a1'), { file: 0, rank: 0 }); });
    it('h1', () => { assert.deepEqual(squareToCoordinates('h1'), { file: 7, rank: 0 }); });
    it('a8', () => { assert.deepEqual(squareToCoordinates('a8'), { file: 0, rank: 7 }); });
    it('h8', () => { assert.deepEqual(squareToCoordinates('h8'), { file: 7, rank: 7 }); });
    it('e3', () => { assert.deepEqual(squareToCoordinates('e3'), { file: 4, rank: 2 }); });

    it('Error with <empty string>', () => { assert.throws(() => squareToCoordinates(''), exception.IllegalArgument); });
    it('Error with cc', () => { assert.throws(() => squareToCoordinates('cc'), exception.IllegalArgument); });
});


describe('Coordinates to square', () => {

    function itCoordinatesToSquare(square, file, rank) {
        it(square, () => {
            assert.deepEqual(coordinatesToSquare(file, rank), square);
            assert.deepEqual(coordinatesToSquare({ file: file, rank: rank }), square);
        });
    }

    itCoordinatesToSquare('a1', 0, 0);
    itCoordinatesToSquare('h1', 7, 0);
    itCoordinatesToSquare('a8', 0, 7);
    itCoordinatesToSquare('h8', 7, 7);
    itCoordinatesToSquare('e3', 4, 2);

    it('Error with (-1,4)', () => { assert.throws(() => coordinatesToSquare(-1, 4), exception.IllegalArgument); });
    it('Error with (8,3)', () => { assert.throws(() => coordinatesToSquare(8, 3), exception.IllegalArgument); });
    it('Error with (5,-1)', () => { assert.throws(() => coordinatesToSquare(5, -1), exception.IllegalArgument); });
    it('Error with (5,8)', () => { assert.throws(() => coordinatesToSquare(7, 8), exception.IllegalArgument); });
});


describe('Opposite color', () => {
    it('white to black', () => { assert.deepEqual(oppositeColor('w'), 'b'); });
    it('black to white', () => { assert.deepEqual(oppositeColor('b'), 'w'); });

    it('Error with z', () => { assert.throws(() => oppositeColor('z'), exception.IllegalArgument); });
    it('Error with bb', () => { assert.throws(() => oppositeColor('bb'), exception.IllegalArgument); });
});


describe('Variant with canonical start position', () => {
    it('no-king', () => { assert.deepEqual(variantWithCanonicalStartPosition('no-king'), false); });
    it('chess960', () => { assert.deepEqual(variantWithCanonicalStartPosition('chess960'), false); });
    it('antichess', () => { assert.deepEqual(variantWithCanonicalStartPosition('antichess'), true); });

    it('Error with invalid variant', () => { assert.throws(() => variantWithCanonicalStartPosition('whatever'), exception.IllegalArgument); });
});


describe('NAG symbols', () => {
    const nags = [ 3, 1, 5, 6, 2, 4, 20, 18, 16, 14, 10, 11, 13, 15, 17, 19, 21, 7, 8, 9, 22, 32, 36, 40, 44, 132, 138, 140, 141, 142, 143, 145, 146 ];
    const expectedSymbols = readText('nags.txt').trim().split(/\s+/);

    function itNagWithSymbol(i) {
        const nag = nags[i];
        it('NAG ' + nag, () => { assert.deepEqual(nagSymbol(nag), expectedSymbols[i]); });
    }

    for (let i = 0; i < nags.length; ++i) {
        itNagWithSymbol(i);
    }

    it('NAG without symbol', () => { assert.deepEqual(nagSymbol(99), '$99'); });

    it('Error with string', () => { assert.throws(() => nagSymbol('1'), exception.IllegalArgument); });
    it('Error with null', () => { assert.throws(() => nagSymbol(null), exception.IllegalArgument); });
    it('Error with non-integer', () => { assert.throws(() => nagSymbol(3.2), exception.IllegalArgument); });
    it('Error with negative integer', () => { assert.throws(() => nagSymbol(-1), exception.IllegalArgument); });
});


describe('Is valid ECO', () => {

    it('Valid ECO 1', () => { assert.deepEqual(isValidECO('A00'), true); });
    it('Valid ECO 2', () => { assert.deepEqual(isValidECO('E99'), true); });

    it('Invalid ECO 1', () => { assert.deepEqual(isValidECO('F00'), false); });
    it('Invalid ECO 2', () => { assert.deepEqual(isValidECO('A00b'), false); });
    it('Invalid ECO (number)', () => { assert.deepEqual(isValidECO(42), false); });
});
