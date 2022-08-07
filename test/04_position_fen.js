/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2022  Yoann Le Montagner <yo35 -at- melix.net>       *
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
 * -------------------------------------------------------------------------- */


const { exception, Position } = require('../dist/lib/index');
const readCSV = require('./common/readcsv');
const test = require('unit.js');


function testData() {
	return readCSV('fens.csv', fields => {
		return {
			label             : fields[0],
			fenIn             : fields[1],
			variant           : fields[2],
			strict            : fields[3]==='true',
			fiftyMoveClock    : parseInt(fields[4]),
			fullMoveNumber    : parseInt(fields[5]),
			fenOutDefault     : fields[6],
			fenOutWithCounters: fields[7],
			fenOutWithVariant : fields[8],
			fenOutWithoutXFEN : fields[9],
		};
	});
}


describe('FEN parsing (tolerant)', () => {
	for (const elem of testData()) {
		it('Position ' + elem.label, () => {
			const position = new Position(elem.variant, 'empty');
			position.fen(elem.fenIn);
			test.value(position.fen()).is(elem.fenOutDefault);
		});
	}
});


describe('FEN parsing (strict)', () => {
	for (const elem of testData()) {
		it('Position ' + elem.label, () => {
			const position = new Position(elem.variant, 'empty');
			if (elem.strict) {
				position.fen(elem.fenIn, true);
				test.value(position.fen()).is(elem.fenOutDefault);
			}
			else {
				test.exception(() => position.fen(elem.fenIn, true)).isInstanceOf(exception.InvalidFEN);
			}
		});
	}
});


describe('FEN counters', () => {
	for (const elem of testData()) {
		it('Position ' + elem.label, () => {
			const position = new Position(elem.variant, elem.fenIn);
			test.value(position.fen({ fiftyMoveClock: elem.fiftyMoveClock, fullMoveNumber: elem.fullMoveNumber })).is(elem.fenOutWithCounters);
		});
	}
});


describe('FEN with variant', () => {
	for (const elem of testData()) {
		it('Position ' + elem.label, () => {
			const position = new Position(elem.variant, elem.fenIn);
			test.value(position.fen({ withVariant: true })).is(elem.fenOutWithVariant);
		});
	}
});


describe('FEN without XFEN if possible', () => {
	for (const elem of testData()) {
		it('Position ' + elem.label, () => {
			const position = new Position(elem.variant, elem.fenIn);
			test.value(position.fen({ regularFENIfPossible: true })).is(elem.fenOutWithoutXFEN);
		});
	}
});
