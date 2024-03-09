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


const { exception, isColor, isPiece, isColoredPiece, isFile, isRank, isSquare, isSquareCouple, isCastle, isCastle960, isGameResult, isGameVariant, squareColor,
    squareToCoordinates, coordinatesToSquare, oppositeColor, variantWithCanonicalStartPosition, nagSymbol, isValidECO } = require('../dist/lib/index');
const readText = require('./common/readtext');
const test = require('unit.js');


function itIsType(func, validCases, invalidCases) {
    for (const validCase of validCases) {
        it(validCase, () => { test.value(func(validCase)).is(true); });
    }
    for (const invalidCase of invalidCases) {
        const label = `Not ${invalidCase === '' ? '<empty string>' : typeof invalidCase === 'number' ? '<number>' : String(invalidCase)}`;
        it(label, () => { test.value(func(invalidCase)).is(false); });
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
    it('a1', () => { test.value(squareColor('a1')).is('b'); });
    it('h1', () => { test.value(squareColor('h1')).is('w'); });
    it('a8', () => { test.value(squareColor('a8')).is('w'); });
    it('h8', () => { test.value(squareColor('h8')).is('b'); });
    it('b3', () => { test.value(squareColor('b3')).is('w'); });
    it('b4', () => { test.value(squareColor('b4')).is('b'); });
    it('c4', () => { test.value(squareColor('c4')).is('w'); });
    it('f5', () => { test.value(squareColor('f5')).is('w'); });
    it('e5', () => { test.value(squareColor('e5')).is('b'); });
    it('e6', () => { test.value(squareColor('e6')).is('w'); });

    it('Error with 7', () => { test.exception(() => squareColor('7')).isInstanceOf(exception.IllegalArgument); });
    it('Error with b8g', () => { test.exception(() => squareColor('b8g')).isInstanceOf(exception.IllegalArgument); });
});


describe('Square to coordinates', () => {
    it('a1', () => { test.value(squareToCoordinates('a1')).is({ file:0, rank:0 }); });
    it('h1', () => { test.value(squareToCoordinates('h1')).is({ file:7, rank:0 }); });
    it('a8', () => { test.value(squareToCoordinates('a8')).is({ file:0, rank:7 }); });
    it('h8', () => { test.value(squareToCoordinates('h8')).is({ file:7, rank:7 }); });
    it('e3', () => { test.value(squareToCoordinates('e3')).is({ file:4, rank:2 }); });

    it('Error with <empty string>', () => { test.exception(() => squareToCoordinates('')).isInstanceOf(exception.IllegalArgument); });
    it('Error with cc', () => { test.exception(() => squareToCoordinates('cc')).isInstanceOf(exception.IllegalArgument); });
});


describe('Coordinates to square', () => {

    function itCoordinatesToSquare(square, file, rank) {
        it(square, () => {
            test.value(coordinatesToSquare(file, rank)).is(square);
            test.value(coordinatesToSquare({ file: file, rank: rank })).is(square);
        });
    }

    itCoordinatesToSquare('a1', 0, 0);
    itCoordinatesToSquare('h1', 7, 0);
    itCoordinatesToSquare('a8', 0, 7);
    itCoordinatesToSquare('h8', 7, 7);
    itCoordinatesToSquare('e3', 4, 2);

    it('Error with (-1,4)', () => { test.exception(() => coordinatesToSquare(-1, 4)).isInstanceOf(exception.IllegalArgument); });
    it('Error with (8,3)', () => { test.exception(() => coordinatesToSquare(8, 3)).isInstanceOf(exception.IllegalArgument); });
    it('Error with (5,-1)', () => { test.exception(() => coordinatesToSquare(5, -1)).isInstanceOf(exception.IllegalArgument); });
    it('Error with (5,8)', () => { test.exception(() => coordinatesToSquare(7, 8)).isInstanceOf(exception.IllegalArgument); });
});


describe('Opposite color', () => {
    it('white to black', () => { test.value(oppositeColor('w')).is('b'); });
    it('black to white', () => { test.value(oppositeColor('b')).is('w'); });

    it('Error with z', () => { test.exception(() => oppositeColor('z')).isInstanceOf(exception.IllegalArgument); });
    it('Error with bb', () => { test.exception(() => oppositeColor('bb')).isInstanceOf(exception.IllegalArgument); });
});


describe('Variant with canonical start position', () => {
    it('no-king', () => { test.value(variantWithCanonicalStartPosition('no-king')).is(false); });
    it('chess960', () => { test.value(variantWithCanonicalStartPosition('chess960')).is(false); });
    it('antichess', () => { test.value(variantWithCanonicalStartPosition('antichess')).is(true); });

    it('Error with invalid variant', () => { test.exception(() => variantWithCanonicalStartPosition('whatever')).isInstanceOf(exception.IllegalArgument); });
});


describe('NAG symbols', () => {
    const nags = [ 3, 1, 5, 6, 2, 4, 20, 18, 16, 14, 10, 11, 13, 15, 17, 19, 21, 7, 8, 9, 22, 32, 36, 40, 44, 132, 138, 140, 141, 142, 143, 145, 146 ];
    const expectedSymbols = readText('nags.txt').trim().split(/\s+/);

    function itNagWithSymbol(i) {
        const nag = nags[i];
        it('NAG ' + nag, () => { test.value(nagSymbol(nag)).is(expectedSymbols[i]); });
    }

    for (let i = 0; i < nags.length; ++i) {
        itNagWithSymbol(i);
    }

    it('NAG without symbol', () => { test.value(nagSymbol(99)).is('$99'); });

    it('Error with string', () => { test.exception(() => nagSymbol('1')).isInstanceOf(exception.IllegalArgument); });
    it('Error with null', () => { test.exception(() => nagSymbol(null)).isInstanceOf(exception.IllegalArgument); });
    it('Error with non-integer', () => { test.exception(() => nagSymbol(3.2)).isInstanceOf(exception.IllegalArgument); });
    it('Error with negative integer', () => { test.exception(() => nagSymbol(-1)).isInstanceOf(exception.IllegalArgument); });
});


describe('Is valid ECO', () => {

    it('Valid ECO 1', () => { test.value(isValidECO('A00')).is(true); });
    it('Valid ECO 2', () => { test.value(isValidECO('E99')).is(true); });

    it('Invalid ECO 1', () => { test.value(isValidECO('F00')).is(false); });
    it('Invalid ECO 2', () => { test.value(isValidECO('A00b')).is(false); });
    it('Invalid ECO (number)', () => { test.value(isValidECO(42)).is(false); });
});
