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


describe('General game header', function() {

	it('Initial state', function() {
		var game = new kokopu.Game();
		test.value(game.event()).is(undefined);
	});

	it('Set & get', function() {
		var game = new kokopu.Game();
		game.event('The event');
		test.value(game.event()).is('The event');
	});

	it('Set empty string', function() {
		var game = new kokopu.Game();
		game.event('');
		test.value(game.event()).is('');
	});

	it('Set blank string', function() {
		var game = new kokopu.Game();
		game.event('  ');
		test.value(game.event()).is('  ');
	});

	it('Set non-string (number)', function() {
		var game = new kokopu.Game();
		game.event(42);
		test.value(game.event()).is('42');
	});

	it('Set non-string (boolean)', function() {
		var game = new kokopu.Game();
		game.event(false);
		test.value(game.event()).is('false');
	});

	it('Erase with undefined', function() {
		var game = new kokopu.Game();
		game.event('The event');
		game.event(undefined);
		test.value(game.event()).is(undefined);
	});

	it('Erase with null', function() {
		var game = new kokopu.Game();
		game.event('The event');
		game.event(null);
		test.value(game.event()).is(undefined);
	});
});


describe('Result header', function() {

	it('Default value', function() {
		var game = new kokopu.Game();
		test.value(game.result()).is('*');
	});

	it('Set & get', function() {
		var game = new kokopu.Game();
		game.result('1-0');
		test.value(game.result()).is('1-0');
	});

	function itInvalidValue(label, value) {
		it(label, function() {
			var game = new kokopu.Game();
			test.exception(function() { game.result(value); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	}

	itInvalidValue('Set dummy value', 'dummy');
	itInvalidValue('Set empty string', '');
	itInvalidValue('Set undefined', undefined);
	itInvalidValue('Set null', null);
});


describe('Color-dependant header', function() {

	function itInvalidColor(label, action) {
		it(label, function() {
			var game = new kokopu.Game();
			test.exception(function() { action(game); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	}

	itInvalidColor('Dummy color 1', function(game) { game.playerName('dummy', 'TheName'); });
	itInvalidColor('Dummy color 2', function(game) { game.playerTitle('ww', 'GM'); });
	itInvalidColor('Dummy color 3', function(game) { game.playerTitle('B', 'IM'); });
	itInvalidColor('Empty color', function(game) { game.playerElo('', '1234'); });
});


describe('Date header', function() {

	it('Initial state', function() {
		var game = new kokopu.Game();
		test.value(game.date()).is(undefined);
		test.value(game.dateAsString()).is(undefined);
	});

	it('Set full date & get', function() {
		var game = new kokopu.Game();
		game.date(new Date(2021, 8, 12));
		test.value(game.date()).isInstanceOf(Date);
		test.value(game.date().toDateString()).is('Sun Sep 12 2021');
	});

	it('Set month+year 1 date & get', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021, month: 12 });
		test.value(game.date()).is({ year: 2021, month: 12 });
	});

	it('Set month+year 2 date & get', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021, month: 7.8 });
		test.value(game.date()).is({ year: 2021, month: 8 });
	});

	it('Set month+year 3 date & get', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021, month: 1.1 });
		test.value(game.date()).is({ year: 2021, month: 1 });
	});

	it('Set year-only date 1 & get', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021 });
		test.value(game.date()).is({ year: 2021 });
	});

	it('Set year-only date 2 & get', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021.2, month: undefined });
		test.value(game.date()).is({ year: 2021 });
	});

	it('Set year-only date 3 & get', function() {
		var game = new kokopu.Game();
		game.date({ year: 2020.7, month: null });
		test.value(game.date()).is({ year: 2021 });
	});

	it('Erase with undefined', function() {
		var game = new kokopu.Game();
		game.date(new Date(2021, 8, 12));
		game.date(undefined);
		test.value(game.date()).is(undefined);
	});

	it('Erase with null', function() {
		var game = new kokopu.Game();
		game.date(new Date(2021, 8, 12));
		game.date(null);
		test.value(game.date()).is(undefined);
	});

	it('Get as string (full date)', function() {
		var game = new kokopu.Game();
		game.date(new Date(2021, 8, 12));
		test.value(game.dateAsString('en-us')).is('September 12, 2021');
		test.value(game.dateAsString('fr')).is('12 septembre 2021');
	});

	it('Get as string (month+year)', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021, month: 12 });
		test.value(game.dateAsString('en-us')).is('December 2021');
		test.value(game.dateAsString('fr')).is('décembre 2021');
	});

	it('Get as string (year only)', function() {
		var game = new kokopu.Game();
		game.date({ year: 2021 });
		test.value(game.dateAsString('en-us')).is('2021');
		test.value(game.dateAsString('fr')).is('2021');
	});

	function itInvalidValue(label, value) {
		it(label, function() {
			var game = new kokopu.Game();
			test.exception(function() { game.date(value); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	}

	itInvalidValue('Set string', 'dummy');
	itInvalidValue('Set boolean', false);
	itInvalidValue('Set empty object', {});
	itInvalidValue('Set object with non-number-valued fields', { year: 'blah' });
	itInvalidValue('Set object undefined-valued fields', { year: undefined });
	itInvalidValue('Set object null-valued fields', { year: null });
	itInvalidValue('Set invalid month value 1', { year: 2021, month: 13 });
	itInvalidValue('Set invalid month value 2', { year: 2021, month: 0 });
});


describe('NAGs', function() {

	it('Set & test', function() {
		var game = new kokopu.Game();
		game.mainVariation().addNag(34);
		test.value(game.mainVariation().nags()).is([ 34 ]);
		test.value(game.mainVariation().hasNag(34)).is(true);
		test.value(game.mainVariation().hasNag(42)).is(false);
	});

	it('Erase', function() {
		var game = new kokopu.Game();
		game.mainVariation().addNag(18);
		game.mainVariation().removeNag(18);
		test.value(game.mainVariation().nags()).is([]);
		test.value(game.mainVariation().hasNag(18)).is(false);
	});

	it('Sorted NAGs', function() {
		var game = new kokopu.Game();
		game.mainVariation().addNag(18);
		game.mainVariation().addNag(11);
		game.mainVariation().addNag(34);
		game.mainVariation().addNag(1234);
		game.mainVariation().addNag(2);
		game.mainVariation().addNag(1);
		test.value(game.mainVariation().nags()).is([ 1, 2, 11, 18, 34, 1234 ]);
	});

	function itInvalidNag(label, value) {
		it(label, function() {
			var gameAdd = new kokopu.Game();
			var gameRemove = new kokopu.Game();
			var gameHas = new kokopu.Game();
			test.exception(function() { gameAdd.mainVariation().addNag(value); }).isInstanceOf(kokopu.exception.IllegalArgument);
			test.exception(function() { gameRemove.mainVariation().removeNag(value); }).isInstanceOf(kokopu.exception.IllegalArgument);
			test.exception(function() { gameHas.mainVariation().hasNag(value); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	}

	itInvalidNag('Non-numeric NAG 1', 'dummy');
	itInvalidNag('Non-numeric NAG 2', '42');
	itInvalidNag('Negative NAG', -1);
	itInvalidNag('NaN NAG', NaN);
});


describe('Tags', function() {

	it('Set & get', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		test.value(game.mainVariation().tags()).is([ 'TheKey' ]);
		test.value(game.mainVariation().tag('TheKey')).is('TheValue');
		test.value(game.mainVariation().tag('AnotherKey')).is(undefined);
	});

	it('Set empty string', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('TheKey1', '');
		test.value(game.mainVariation().tags()).is([ 'TheKey1' ]);
		test.value(game.mainVariation().tag('TheKey1')).is('');
	});

	it('Set blank string', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('__TheKey__', '  ');
		test.value(game.mainVariation().tags()).is([ '__TheKey__' ]);
		test.value(game.mainVariation().tag('__TheKey__')).is('  ');
	});

	it('Set non-string (number)', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('_', 42);
		test.value(game.mainVariation().tags()).is([ '_' ]);
		test.value(game.mainVariation().tag('_')).is('42');
	});

	it('Set non-string (boolean)', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('123', false);
		test.value(game.mainVariation().tags()).is([ '123' ]);
		test.value(game.mainVariation().tag('123')).is('false');
	});

	it('Erase with undefined', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		game.mainVariation().tag('TheKey', undefined);
		test.value(game.mainVariation().tags()).is([]);
		test.value(game.mainVariation().tag('TheKey')).is(undefined);
	});

	it('Erase with null', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		game.mainVariation().tag('TheKey', null);
		test.value(game.mainVariation().tags()).is([]);
		test.value(game.mainVariation().tag('TheKey')).is(undefined);
	});

	it('Sorted keys', function() {
		var game = new kokopu.Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		game.mainVariation().tag('ABCD', 'Another value');
		game.mainVariation().tag('1234', 'Some number');
		game.mainVariation().tag('_a', '');
		game.mainVariation().tag('32', 'blah');
		game.mainVariation().tag('xyz', 0);
		game.mainVariation().tag('Blah', 33);
		test.value(game.mainVariation().tags()).is([ '1234', '32', 'ABCD', 'Blah', 'TheKey', '_a', 'xyz' ]);
	});

	function itInvalidKey(label, action) {
		it(label, function() {
			var game = new kokopu.Game();
			test.exception(function() { action(game.mainVariation()); }).isInstanceOf(kokopu.exception.IllegalArgument);
		});
	}

	itInvalidKey('Dummy key 1', function(node) { node.tag('.', 'TheValue'); });
	itInvalidKey('Dummy key 2', function(node) { node.tag('-', undefined); });
	itInvalidKey('Empty key', function(node) { node.tag('', 'Whatever'); });
	itInvalidKey('Blank key', function(node) { node.tag(' ', 'The value'); });
});
