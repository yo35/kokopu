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
var readText = require('./common/readtext');
var test = require('unit.js');


describe('ASCII', function() {

	function itAscii(filename, factory) {
		it(filename, function() {
			var expectedText = readText('games/' + filename + '.txt').trim();
			var game = factory();
			test.value(game.ascii().trim()).is(expectedText);
		});
	}

	itAscii('base', function() {
		var game = new kokopu.Game();
		game.playerName('w', 'Alice');
		game.playerName('b', 'Bob');
		game.event('1st International Open of Whatever');

		var current = game.mainVariation();
		current = current.play('e4');
		current = current.play('e5');

		var alternative1 = current.addVariation();
		alternative1.play('c5').play('Nf3');

		var alternative2 = current.addVariation();
		alternative2.play('e6').play('d4');

		current = current.play('Bc4');
		current = current.play('Nc6');
		current = current.play('Qh5');
		current = current.play('Nf6');
		current = current.play('Qxf7#');
		current.comment('That is the Scholar\'s Mate');
		game.result('1-0');
		return game;
	});

	itAscii('empty', function() {
		return new kokopu.Game();
	});

	itAscii('all-headers', function() {
		var game = new kokopu.Game();
		game.annotator(' The   Annotator ');
		game.date(new Date(2021, 8, 4));
		game.event('An event name\nspanning several lines');
		game.playerElo('w', 1942);
		game.playerElo('b', 2421);
		game.playerName('w', '  Light side\n\n');
		game.playerName('b', 'Dark\n \n\rside');
		game.playerTitle('w', 'CM');
		game.playerTitle('b', 'IM');
		game.round(1);
		game.site('Somewhere...');
		game.result('0-1');
		return game;
	});

	itAscii('missing-headers-1', function() {
		var game = new kokopu.Game();
		game.date({ year: 1998 });
		game.playerElo('w', 2345);
		game.playerName('w', 'John Doe');
		game.playerTitle('b', 'GM');
		game.round('3');
		game.result('1/2-1/2');
		return game;
	});

	itAscii('missing-headers-2', function() {
		var game = new kokopu.Game();
		game.date({ year: 1955, month: 11 });
		game.event('International Championship of Whatever');
		game.playerElo('w', '2299');
		game.playerTitle('w', 'FM');
		game.playerName('b', 'Mister No-Name');
		game.result('*');
		return game;
	});

	itAscii('custom-initial-position', function() {
		var game = new kokopu.Game();
		game.event('Custom initial position');
		game.initialPosition(new kokopu.Position('8/2k5/p1P5/P1K5/8/8/8/8 w - - 0 60'), 60);
		game.mainVariation().play('Kd5').play('Kc8').play('Kd4').play('Kd8').play('Kc4').play('Kc8').play('Kd5').play('Kc7').play('Kc5').play('Kc8').play('Kb6').addNag(18);
		game.result('1-0');
		return game;
	});

	itAscii('chess-variant', function() {
		var game = new kokopu.Game();
		game.event('Chess game variant');
		game.initialPosition(new kokopu.Position('chess960', 'rnbqnkrb/pppppppp/8/8/8/8/PPPPPPPP/RNBQNKRB w KQkq - 0 1'));
		game.mainVariation().play('O-O');
		return game;
	});

	itAscii('nags', function() {
		var game = new kokopu.Game();
		game.event('Game with NAGs');
		var current = game.mainVariation().play('Nf3');
		current.addNag(3);
		current = current.play('Nf6');
		current.addNag(1);
		current = current.play('Ng1');
		current.addNag(5);
		current = current.play('Ng8');
		current.addNag(6);
		current = current.play('Nf3');
		current.addNag(2);
		current = current.play('Nf6');
		current.addNag(4);
		current = current.play('Ng1');
		current.addNag(18);
		current = current.play('Ng8');
		current.addNag(16);
		current = current.play('Nf3');
		current.addNag(14);
		current = current.play('Nf6');
		current.addNag(10);
		current = current.play('Ng1');
		current.addNag(13);
		current = current.play('Ng8');
		current.addNag(15);
		current = current.play('Nf3');
		current.addNag(17);
		current = current.play('Nf6');
		current.addNag(19);
		current = current.play('Ng1');
		current.addNag(42);
		return game;
	});

	itAscii('annotations', function() {
		var game = new kokopu.Game();
		game.event('Game with annotations');
		game.annotator('Myself');

		var current = game.mainVariation().play('e4').play('e5').play('Bc4').play('Nc6').play('Qh5');
		current.comment('Threatening checkmate');
		current.tag('csl', 'Rf7');
		current.tag('cal', 'Gc4f7,Gh5f7');

		current = current.play('g6');
		current.comment('Avoid the checkmate');
		current.addNag(1);
		current.tag('cal', 'Rg6h5');

		var alternative = current.addVariation();
		alternative.comment('Other defense are possible, for instance:');
		alternative.play('Nf6');

		current = current.play('Qf3');

		game.annotator(null); // erase the annotator
		return game;
	});

	itAscii('sub-variations', function() {
		var game = new kokopu.Game();
		game.event('Game with variations and sub-variations');
		game.annotator('Myself');

		var current = game.mainVariation().play('e4').play('e5');
		current.addVariation().play('c6');
		current.addVariation().play('c5').play('Nc3').addVariation().play('Nf3').play('d6');
		current = current.play('Nf3');
		current.addVariation();
		current = current.play('Nc6').play('Bc4');

		var variation = current.addVariation();
		variation = variation.play('Bb5').play('a6');
		variation.addVariation().play('Nf6');
		variation = variation.play('Ba4');
		variation.addVariation().play('Bxc6').play('dxc6');

		game.annotator(undefined); // erase the annotator
		return game;
	});
});
