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
var readCSV = require('./common/readcsv');


function testData() {
	return readCSV('fens.csv', function(fields) {
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


describe('FEN parsing (tolerant)', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var position = new kokopu.Position(elem.variant, 'empty');
			position.fen(elem.fenIn);
			test.value(position.fen()).is(elem.fenOutDefault);
		});
	});
});


describe('FEN parsing (strict)', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var position = new kokopu.Position(elem.variant, 'empty');
			if(elem.strict) {
				position.fen(elem.fenIn, true);
				test.value(position.fen()).is(elem.fenOutDefault);
			}
			else {
				test.exception(function() { position.fen(elem.fenIn, true); }).isInstanceOf(kokopu.exception.InvalidFEN);
			}
		});
	});
});


describe('FEN counters', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var position = new kokopu.Position(elem.variant, elem.fenIn);
			test.value(position.fen({ fiftyMoveClock:elem.fiftyMoveClock, fullMoveNumber:elem.fullMoveNumber })).is(elem.fenOutWithCounters);
		});
	});
});


describe('FEN with variant', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var position = new kokopu.Position(elem.variant, elem.fenIn);
			test.value(position.fen({ withVariant: true })).is(elem.fenOutWithVariant);
		});
	});
});


describe('FEN without XFEN if possible', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var position = new kokopu.Position(elem.variant, elem.fenIn);
			test.value(position.fen({ regularFENIfPossible: true })).is(elem.fenOutWithoutXFEN);
		});
	});
});
