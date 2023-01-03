/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2023  Yoann Le Montagner <yo35 -at- melix.net>       *
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


const { exception, Game, Position } = require('../dist/lib/index');
const test = require('unit.js');


describe('General game header', () => {

	it('Initial state', () => {
		const game = new Game();
		test.value(game.event()).is(undefined);
	});

	it('Set & get', () => {
		const game = new Game();
		game.event('The event');
		test.value(game.event()).is('The event');
	});

	it('Set empty string', () => {
		const game = new Game();
		game.event('');
		test.value(game.event()).is('');
	});

	it('Set blank string', () => {
		const game = new Game();
		game.event('  ');
		test.value(game.event()).is('  ');
	});

	it('Set non-string (number)', () => {
		const game = new Game();
		game.event(42);
		test.value(game.event()).is('42');
	});

	it('Set non-string (boolean)', () => {
		const game = new Game();
		game.event(false);
		test.value(game.event()).is('false');
	});

	it('Erase with undefined', () => {
		const game = new Game();
		game.event('The event');
		game.event(undefined);
		test.value(game.event()).is(undefined);
	});

	it('Erase with null', () => {
		const game = new Game();
		game.event('The event');
		game.event(null);
		test.value(game.event()).is(undefined);
	});
});


describe('Result header', () => {

	it('Default value', () => {
		const game = new Game();
		test.value(game.result()).is('*');
	});

	it('Set & get', () => {
		const game = new Game();
		game.result('1-0');
		test.value(game.result()).is('1-0');
	});

	function itInvalidValue(label, value) {
		it(label, () => {
			const game = new Game();
			test.exception(() => game.result(value)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidValue('Set dummy value', 'dummy');
	itInvalidValue('Set empty string', '');
	itInvalidValue('Set undefined', undefined);
	itInvalidValue('Set null', null);
});


describe('ECO header', () => {

	function itInvalidValue(label, value) {
		it(label, () => {
			const game = new Game();
			test.exception(() => game.eco(value)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidValue('Set dummy value', 'dummy');
	itInvalidValue('Set empty string', '');
	itInvalidValue('Set out-of-range code', 'F00');
	itInvalidValue('Set untrimmed code 1', ' A18');
	itInvalidValue('Set untrimmed code 2', 'A18 ');
});


describe('Color-dependant header', () => {

	function itInvalidColor(label, action) {
		it(label, () => {
			const game = new Game();
			test.exception(() => action(game)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidColor('Dummy color 1', game => game.playerName('dummy', 'TheName'));
	itInvalidColor('Dummy color 2', game => game.playerTitle('ww', 'GM'));
	itInvalidColor('Dummy color 3', game => game.playerTitle('B', 'IM'));
	itInvalidColor('Empty color', game => game.playerElo('', '1234'));
});


describe('Elo header', () => {

	it('Set number 1', () => {
		const game = new Game();
		game.playerElo('w', 899);
		test.value(game.playerElo('w')).is(899);
	});

	it('Set number 2', () => {
		const game = new Game();
		game.playerElo('w', 0);
		test.value(game.playerElo('w')).is(0);
	});

	it('Set number as string', () => {
		const game = new Game();
		game.playerElo('b', '2000');
		test.value(game.playerElo('b')).is(2000);
	});

	function itInvalidElo(label, action) {
		it(label, () => {
			const game = new Game();
			test.exception(() => action(game)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidElo('Non-convertible string', game => game.playerElo('w', 'two thousand'));
	itInvalidElo('Invalid elo value', game => game.playerElo('b', -42));
});


describe('Date header', () => {

	function testDateIsUndefined(game) {
		test.value(game.date()).is(undefined);
		test.value(game.dateAsDate()).is(undefined);
	}

	function testDateIs(game, value, dateValue) {
		test.value(game.date()).isNotFalse();
		test.value(game.date().toString()).is(value);
		test.value(game.dateAsDate()).is(dateValue);
	}

	it('Initial state', () => {
		const game = new Game();
		testDateIsUndefined(game);
	});

	it('Set JS Date & get', () => {
		const game = new Game();
		game.date(new Date(2021, 8, 12));
		testDateIs(game, '2021-09-12', new Date(2021, 8, 12));
	});

	it('Set full date & get', () => {
		const game = new Game();
		game.date(2021, 9, 12);
		testDateIs(game, '2021-09-12', new Date(2021, 8, 12));
	});

	it('Set month+year date 1 & get', () => {
		const game = new Game();
		game.date(2021, 12);
		testDateIs(game, '2021-12-**', new Date(2021, 11, 1));
	});

	it('Set month+year date 2 & get', () => {
		const game = new Game();
		game.date(2021, 2, undefined);
		testDateIs(game, '2021-02-**', new Date(2021, 1, 1));
	});

	it('Set month+year date 3 & get', () => {
		const game = new Game();
		game.date(2021, 2, null);
		testDateIs(game, '2021-02-**', new Date(2021, 1, 1));
	});

	it('Set year-only date 1 & get', () => {
		const game = new Game();
		game.date(2021);
		testDateIs(game, '2021-**-**', new Date(2021, 0, 1));
	});

	it('Set year-only date 2 & get', () => {
		const game = new Game();
		game.date(1, undefined);
		testDateIs(game, '0001-**-**', new Date(1, 0, 1));
	});

	it('Set year-only date 3 & get', () => {
		const game = new Game();
		game.date(99, null);
		testDateIs(game, '0099-**-**', new Date(99, 0, 1));
	});

	it('Set year-only date 4 & get', () => {
		const game = new Game();
		game.date(1921, undefined, undefined);
		testDateIs(game, '1921-**-**', new Date(1921, 0, 1));
	});

	it('Erase with undefined', () => {
		const game = new Game();
		game.date(2021, 9, 12);
		game.date(undefined);
		testDateIsUndefined(game);
	});

	it('Erase with null', () => {
		const game = new Game();
		game.date(2021, 9, 12);
		game.date(null);
		testDateIsUndefined(game);
	});

	it('Get as string (full date)', () => {
		const game = new Game();
		game.date(2021, 9, 12);
		test.value(game.dateAsString('en-us')).is('September 12, 2021');
		test.value(game.dateAsString('fr')).is('12 septembre 2021');
	});

	it('Get as string (month+year)', () => {
		const game = new Game();
		game.date(2021, 12);
		test.value(game.dateAsString('en-us')).is('December 2021');
		test.value(game.dateAsString('fr')).is('décembre 2021');
	});

	it('Get as string (year only)', () => {
		const game = new Game();
		game.date(2021);
		test.value(game.dateAsString('en-us')).is('2021');
		test.value(game.dateAsString('fr')).is('2021');
	});

	function itInvalidValue(label, value) {
		it(label, () => {
			const game = new Game();
			test.exception(() => game.date(value)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidValue('Set string', 'dummy');
	itInvalidValue('Set boolean', false);
	itInvalidValue('Set empty object', {});
	itInvalidValue('Set invalid year 1', -5);
	itInvalidValue('Set invalid year 2', 1989.3);

	function itInvalidYMD(label, year, month, day) {
		it(label, () => {
			const game = new Game();
			test.exception(() => game.date(year, month, day)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidYMD('Set invalid month 1', 2021, 13, undefined);
	itInvalidYMD('Set invalid month 2', 2021, 0, undefined);
	itInvalidYMD('Set invalid month 3', 2021, 5.7, undefined);
	itInvalidYMD('Set invalid day 1', 2021, 8, 0);
	itInvalidYMD('Set invalid day 2', 2021, 6, 31);
	itInvalidYMD('Set invalid day 3', 2021, 3, 3.1);
	itInvalidYMD('Set day without month', 2021, undefined, 4);
	itInvalidYMD('Set month without year', undefined, 8, undefined);
	itInvalidYMD('Set all undefined', undefined, undefined, undefined);
});


describe('NAGs', () => {

	it('Set & test', () => {
		const game = new Game();
		const node = game.mainVariation().play('e4');
		game.mainVariation().addNag(34);
		node.addNag(28);
		test.value(game.mainVariation().nags()).is([ 34 ]);
		test.value(game.mainVariation().hasNag(34)).is(true);
		test.value(game.mainVariation().hasNag(42)).is(false);
		test.value(node.nags()).is([ 28 ]);
		test.value(node.hasNag(28)).is(true);
		test.value(node.hasNag(75)).is(false);
	});

	it('Erase', () => {
		const game = new Game();
		const node = game.mainVariation().play('d4');
		game.mainVariation().addNag(18);
		game.mainVariation().removeNag(18);
		node.addNag(62);
		node.addNag(13);
		node.removeNag(62);
		test.value(game.mainVariation().nags()).is([]);
		test.value(game.mainVariation().hasNag(18)).is(false);
		test.value(node.nags()).is([ 13 ]);
		test.value(node.hasNag(13)).is(true);
		test.value(node.hasNag(62)).is(false);
	});

	it('Sorted NAGs', () => {
		const game = new Game();
		game.mainVariation().addNag(18);
		game.mainVariation().addNag(11);
		game.mainVariation().addNag(34);
		game.mainVariation().addNag(1234);
		game.mainVariation().addNag(2);
		game.mainVariation().addNag(1);
		test.value(game.mainVariation().nags()).is([ 1, 2, 11, 18, 34, 1234 ]);
	});

	function itInvalidNag(label, value) {
		it(label, () => {
			const gameAdd = new Game();
			const gameRemove = new Game();
			const gameHas = new Game();
			test.exception(() => gameAdd.mainVariation().addNag(value)).isInstanceOf(exception.IllegalArgument);
			test.exception(() => gameRemove.mainVariation().removeNag(value)).isInstanceOf(exception.IllegalArgument);
			test.exception(() => gameHas.mainVariation().hasNag(value)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidNag('Non-numeric NAG 1', 'dummy');
	itInvalidNag('Non-numeric NAG 2', '42');
	itInvalidNag('Negative NAG', -1);
	itInvalidNag('NaN NAG', NaN);
});


describe('Tags', () => {

	it('Set & get', () => {
		const game = new Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		test.value(game.mainVariation().tags()).is([ 'TheKey' ]);
		test.value(game.mainVariation().tag('TheKey')).is('TheValue');
		test.value(game.mainVariation().tag('AnotherKey')).is(undefined);
	});

	it('Set empty string', () => {
		const game = new Game();
		game.mainVariation().tag('TheKey1', '');
		test.value(game.mainVariation().tags()).is([ 'TheKey1' ]);
		test.value(game.mainVariation().tag('TheKey1')).is('');
	});

	it('Set blank string', () => {
		const game = new Game();
		game.mainVariation().tag('__TheKey__', '  ');
		test.value(game.mainVariation().tags()).is([ '__TheKey__' ]);
		test.value(game.mainVariation().tag('__TheKey__')).is('  ');
	});

	it('Set non-string (number)', () => {
		const game = new Game();
		game.mainVariation().tag('_', 42);
		test.value(game.mainVariation().tags()).is([ '_' ]);
		test.value(game.mainVariation().tag('_')).is('42');
	});

	it('Set non-string (boolean)', () => {
		const game = new Game();
		game.mainVariation().tag('123', false);
		test.value(game.mainVariation().tags()).is([ '123' ]);
		test.value(game.mainVariation().tag('123')).is('false');
	});

	it('Erase with undefined', () => {
		const game = new Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		game.mainVariation().tag('TheKey', undefined);
		test.value(game.mainVariation().tags()).is([]);
		test.value(game.mainVariation().tag('TheKey')).is(undefined);
	});

	it('Erase with null', () => {
		const game = new Game();
		game.mainVariation().tag('TheKey', 'TheValue');
		game.mainVariation().tag('TheKey', null);
		test.value(game.mainVariation().tags()).is([]);
		test.value(game.mainVariation().tag('TheKey')).is(undefined);
	});

	it('Sorted keys', () => {
		const game = new Game();
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
		it(label, () => {
			const game = new Game();
			test.exception(() => action(game.mainVariation())).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidKey('Dummy key 1', node => node.tag('.', 'TheValue'));
	itInvalidKey('Dummy key 2', node => node.tag('-', undefined));
	itInvalidKey('Empty key', node => node.tag('', 'Whatever'));
	itInvalidKey('Blank key', node => node.tag(' ', 'The value'));
	itInvalidKey('Undefined key', node => node.tag(undefined, 'Another value'));
});


describe('Invalid findById', () => {

	function itInvalidId(label, id) {
		it(label, () => {

			const game = new Game();
			let current = game.mainVariation();
			current = current.play('e4');
			current = current.play('e5');

			const alternative1 = current.addVariation();
			alternative1.play('c5').play('Nf3');

			const alternative2 = current.addVariation();
			alternative2.play('e6').play('d4');

			current = current.play('Bc4');
			current = current.play('Nc6');
			current = current.play('Qh5');
			current = current.play('Nf6');
			current = current.play('Qxf7#');
			game.result('1-0');

			test.value(game.findById(id)).is(undefined);
		});
	}

	itInvalidId('Empty', '');
	itInvalidId('Missing start', '1b-v0');
	itInvalidId('Invalid variation index', '1b-vOne-start');
	itInvalidId('Out of bound variation index', '1b-v2-start');
	itInvalidId('Out of bound node 1', '5w');
	itInvalidId('Out of bound node 2', '1b-v0-2b');
	itInvalidId('Out of bound node 3', '5w-v0-start');
});


describe('Invalid initial position', () => {

	function itInvalidInitialPosition(label, action) {
		it(label, () => {
			const game = new Game();
			test.exception(() => action(game)).isInstanceOf(exception.IllegalArgument);
		});
	}

	itInvalidInitialPosition('Not a position 1', game => game.initialPosition(42));
	itInvalidInitialPosition('Not a position 2', game => game.initialPosition('whatever'));
	itInvalidInitialPosition('Invalid full-move number', game => game.initialPosition(new Position(), 'not-a-number'));
});
