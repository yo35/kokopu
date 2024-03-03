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


const { exception, Position } = require('../dist/lib/index');
const dumpCastlingFlags = require('./common/dumpcastlingflags');
const readCSV = require('./common/readcsv');
const test = require('unit.js');


function itForEach(fun) {
	const testData = readCSV('fens.csv', fields => {
		const label = fields[0].trim();
		if (label.length === 0 || label.charAt(0) === '#') {
			return false;
		}
		return {
			label             : fields[ 0],
			fenIn             : fields[ 1],
			variant           : fields[ 2],
			strict            : fields[ 3]==='true',
			castling          : fields[ 4],
			enPassant         : fields[ 5],
			fiftyMoveClock    : parseInt(fields[6]),
			fullMoveNumber    : parseInt(fields[7]),
			fenOutDefault     : fields[ 8],
			fenOutWithCounters: fields[ 9],
			fenOutWithoutXFEN : fields[10],
		};
	});

	for (const elem of testData) {
		if (elem) {
			it(elem.label, () => { fun(elem); });
		}
	}
}


describe('FEN parsing (tolerant)', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, 'empty');
		position.fen(elem.fenIn);
		test.value(position.fen()).is(elem.fenOutDefault);
	});
});


describe('FEN parsing (strict)', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, 'empty');
		if (elem.strict) {
			position.fen(elem.fenIn, true);
			test.value(position.fen()).is(elem.fenOutDefault);
		}
		else {
			test.exception(() => position.fen(elem.fenIn, true)).isInstanceOf(exception.InvalidFEN);
		}
	});
});


describe('Castling flag parsing', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, 'empty');
		position.fen(elem.fenIn);
		test.value(dumpCastlingFlags(position, (p, castle) => p.castling(castle))).is(elem.castling);
	});
});



describe('En-passant flag parsing', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, 'empty');
		position.fen(elem.fenIn);
		test.value(position.enPassant()).is(elem.enPassant);
	});
});


describe('FEN counter parsing', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, 'empty');
		const { fiftyMoveClock, fullMoveNumber } = position.fen(elem.fenIn);
		test.value(fiftyMoveClock).is(elem.fiftyMoveClock);
		test.value(fullMoveNumber).is(elem.fullMoveNumber);
	});
});


describe('FEN counters', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, elem.fenIn);
		test.value(position.fen({ fiftyMoveClock: elem.fiftyMoveClock * 2, fullMoveNumber: elem.fullMoveNumber + 1 })).is(elem.fenOutWithCounters);
	});
});


describe('FEN with variant', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, elem.fenIn);
		test.value(position.fen({ withVariant: true })).is(elem.variant + ':' + elem.fenOutDefault);
	});
});


describe('FEN without XFEN if possible', () => {
	itForEach(elem => {
		const position = new Position(elem.variant, elem.fenIn);
		test.value(position.fen({ regularFENIfPossible: true })).is(elem.fenOutWithoutXFEN === '' ? elem.fenOutDefault : elem.fenOutWithoutXFEN);
	});
});


describe('Invalid FEN overloads', () => {

	function itInvalidOverload(label, action) {
		it(label, () => {
			const position = new Position();
			test.exception(() => action(position)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidOverload('Invalid key for getter', pos => pos.fen({ fiftyMoveClock: 'forty two' }));
	itInvalidOverload('Non-string input for setter', pos => pos.fen(42));
	itInvalidOverload('Non-boolean option for setter', pos => pos.fen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 42));
});
