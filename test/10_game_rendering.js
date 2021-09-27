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

var oneGamefactories = {

	'base': function() {
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
	},

	'empty': function() {
		return new kokopu.Game();
	},

	'all-headers': function() {
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
	},

	'missing-headers-1': function() {
		var game = new kokopu.Game();
		game.date({ year: 1998 });
		game.playerElo('w', 2345);
		game.playerName('w', 'John Doe');
		game.playerTitle('b', 'GM');
		game.round('3');
		game.result('1/2-1/2');
		return game;
	},

	'missing-headers-2': function() {
		var game = new kokopu.Game();
		game.date({ year: 1955, month: 11 });
		game.round(3);
		game.playerElo('w', '2299');
		game.playerTitle('w', 'FM');
		game.playerName('b', 'Mister No-Name');
		game.result('*');
		return game;
	},

	'blank-headers-1': function() {
		var game = new kokopu.Game();
		game.event('');
		game.round('');
		game.playerName('w', '');
		game.playerElo('w', '');
		game.playerTitle('w', '');
		game.playerName('b', ' ');
		game.playerElo('b', ' ');
		game.playerTitle('b', ' ');
		game.annotator('');
		game.mainVariation().comment('');
		game.result('*');
		return game;
	},

	'blank-headers-2': function() {
		var game = new kokopu.Game();
		game.event(' ');
		game.round(' ');
		game.annotator(' ');
		game.mainVariation().comment(' ');
		game.result('*');
		return game;
	},

	'custom-initial-position-1': function() {
		var game = new kokopu.Game();
		game.event('Custom initial position');
		game.initialPosition(new kokopu.Position('8/2k5/p1P5/P1K5/8/8/8/8 w - - 0 60'), 60);
		game.mainVariation().play('Kd5').play('Kc8').play('Kd4').play('Kd8').play('Kc4').play('Kc8').play('Kd5').play('Kc7').play('Kc5').play('Kc8').play('Kb6').addNag(18);
		game.result('1-0');
		return game;
	},

	'custom-initial-position-2': function() {
		var game = new kokopu.Game();
		game.event('Custom initial position (Black to play)');
		game.initialPosition(new kokopu.Position('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4'), 4);
		game.mainVariation().play('O-O');
		return game;
	},

	'variant-chess960': function() {
		var game = new kokopu.Game();
		game.event('Chess game variant - Chess960');
		game.initialPosition(new kokopu.Position('chess960', 'rnbqnkrb/pppppppp/8/8/8/8/PPPPPPPP/RNBQNKRB w KQkq - 0 1'));
		game.mainVariation().play('O-O');
		return game;
	},

	'variant-no-king': function() {
		var game = new kokopu.Game();
		game.event('Chess game variant - No king');
		game.initialPosition(new kokopu.Position('no-king', 'r7/8/8/8/8/8/8/7R w - - 0 1'));
		game.mainVariation().play('Rh8').play('Ra1').play('Ra8').play('Rh1').play('Ra1').play('Rh8').play('Rh1').play('Ra8');
		return game;
	},

	'variant-antichess': function() {
		var game = new kokopu.Game();
		game.event('Chess game variant - Antichess');
		game.initialPosition(new kokopu.Position('antichess'));
		return game;
	},

	'variant-horde': function() {
		var game = new kokopu.Game();
		game.event('Chess game variant - Horde');
		game.initialPosition(new kokopu.Position('horde'));
		return game;
	},

	'nags': function() {
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
	},

	'annotations-1': function() {
		var game = new kokopu.Game();
		game.event('Game with annotations 1');
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
		alternative.comment('Other defenses are possible, for instance:');
		alternative.play('Nf6');

		current = current.play('Qf3');

		game.annotator(null); // erase the annotator
		return game;
	},

	'annotations-2': function() {
		var game = new kokopu.Game();
		game.event('Game with annotations 2');

		var current = game.mainVariation();
		current.addNag(10);

		current = current.play('e4');
		current.addNag(13);
		current.addNag(5);

		current = current.play('e5').play('Nf3');
		current.tag('cal', 'Rf3e5');

		current = current.play('Nc6');
		current.tag('emptytag', '');

		current = current.play('Bc4');
		current.comment('');

		current = current.play('Bc5');
		current.tag('blanktag', ' ');

		current = current.play('c3');
		current.comment(' ');

		current = current.play('Nf6').play('d4');
		current.tag('cal', 'Rd4c5,Rd4e5');
		current.comment(' ');

		current = current.play('exd4').play('cxd4');
		var alternative1 = current.addVariation();
		alternative1.comment('You should not see in PGN this since there is no move in the variation...');

		current = current.play('Bb4+');
		var alternative2 = current.addVariation();
		alternative2.comment('');

		current = current.play('Nc3');
		var alternative3 = current.addVariation();
		alternative3.comment(' ');

		current = current.play('O-O');
		current.tag('TheFirstTag', 'a[b]c');
		current.tag('TheOtherTag', ' ');

		return game;
	},

	'sub-variations': function() {
		var game = new kokopu.Game();
		game.event('Game with variations and sub-variations');
		game.annotator('Myself');
		game.mainVariation().comment('I\'m the main variation header comment.');

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
	},

	'escaped-text': function() {
		var game = new kokopu.Game();
		game.event('Event with a \\ backslash');
		game.site('Site with " double-quotes');
		game.mainVariation().comment('Comment with \\ backslash and { some } braces...');
		return game;
	},

	'long-short-comments-variations': function() {
		var game = new kokopu.Game();
		game.event('Game with long & short comments and variations.');
		game.mainVariation().comment('I\'m the main variation header comment.', true);

		var current = game.mainVariation().play('e4');
		current.comment('I\'m a long comment.', true);

		current = current.play('e5');
		current.addVariation(true).play('c5').play('Nf3');

		current = current.play('Nf3').play('Nc6').play('Bc4');
		var alternative = current.addVariation(true);
		alternative.comment('I\'m a long comment too.', true);
		alternative.play('Bb5').play('a6').comment('I\'m a short comment.', false);

		current.play('Bc5');
		return game;
	},
};

var fullPgnFactories = {

	'empty': function() {
		return [];
	},

	'mini2': function() {

		var game0 = new kokopu.Game();
		game0.event('TV Show');
		game0.date(new Date(2014, 0, 23));
		game0.playerName('w', 'Bill Gates');
		game0.playerName('b', 'Magnus Carlsen');
		game0.result('0-1');
		game0.mainVariation().play('e4').play('Nc6').play('Nf3').play('d5').play('Bd3').play('Nf6').play('exd5').play('Qxd5').play('Nc3').play('Qh5').play('O-O').play('Bg4').play('h3').play('Ne5').play('hxg4').play('Nfxg4').play('Nxe5').play('Qh2#');

		var game1 = new kokopu.Game();
		game1.event('Sample game');
		game1.result('1-0');
		game1.mainVariation().play('e4').play('e5').play('Bc4').play('Nc6').play('Qh5').play('Nf6').play('Qxf7#');

		return [ game0, game1 ];
	}
};


describe('Write ASCII', function() {

	function itAscii(filename, factory) {
		it(filename, function() {
			var expectedText = readText('games/' + filename + '.txt').trim();
			var game = factory();
			test.value(game.ascii().trim()).is(expectedText);
		});
	}

	for (var f in oneGamefactories) {
		itAscii(f, oneGamefactories[f]);
	}
});


describe('Write PGN', function() {

	function itOneGamePgn(filename, factory) {
		it(filename, function() {
			var expectedText = readText('games/' + filename + '.pgn');
			var game = factory();
			test.value(kokopu.pgnWrite(game)).is(expectedText);
		});
	}

	for (var f in oneGamefactories) {
		itOneGamePgn(f, oneGamefactories[f]);
	}

	function itFullPgn(filename, factory) {
		it('Full PGN - ' + filename, function() {
			var expectedText = readText('pgns/' + filename + '.pgn');
			var games = factory();
			test.value(kokopu.pgnWrite(games)).is(expectedText);
		});
	}

	for (var f in fullPgnFactories) {
		itFullPgn(f, fullPgnFactories[f]);
	}
});
