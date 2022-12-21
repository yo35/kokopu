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


const { Game, Position, AbstractNode, Node, Variation, pgnRead, pgnWrite } = require('../dist/lib/index');
const readText = require('./common/readtext');
const resourceExists = require('./common/resourceexists');
const dumpGame = require('./common/dumpgame');
const test = require('unit.js');

/**
 * WARNING: this factory must return a game with all the headers set to a non-default value. Do not forget to update when adding new headers.
 */
function allHeaderFactory() {
	const game = new Game();
	game.annotator(' The   Annotator ');
	game.date(2021, 9, 4);
	game.eco('D42');
	game.event('An event name\nspanning several lines');
	game.playerElo('w', 1942);
	game.playerElo('b', 2421);
	game.playerName('w', '  Light side\n\n');
	game.playerName('b', 'Dark\n \n\rside');
	game.playerTitle('w', 'CM');
	game.playerTitle('b', 'IM');
	game.round(1);
	game.site('Somewhere...');
	game.opening('Sicilian Defense');
	game.openingVariation('Dragon');
	game.openingSubVariation('Yugoslav Attack');
	game.termination('adjudication');
	game.result('0-1');
	return game;
}

const oneGamefactories = {

	'base': () => {
		const game = new Game();
		game.playerName('w', 'Alice');
		game.playerName('b', 'Bob');
		game.event('1st International Open of Whatever');

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
		current.comment('That is the Scholar\'s Mate');
		game.result('1-0');
		return game;
	},

	'empty': () => new Game(),

	'all-headers': allHeaderFactory,

	'all-headers-cleared': () => {
		const game = allHeaderFactory();
		game.clearHeaders();
		return game;
	},

	'missing-headers-1': () => {
		const game = new Game();
		game.date(1998);
		game.playerElo('w', 2345);
		game.playerName('w', 'John Doe');
		game.playerTitle('b', 'GM');
		game.round('3');
		game.openingVariation('TheVariation');
		game.result('1/2-1/2');
		return game;
	},

	'missing-headers-2': () => {
		const game = new Game();
		game.date(1955, 11);
		game.round(3);
		game.playerElo('w', '2299');
		game.playerTitle('w', 'FM');
		game.playerName('b', 'Mister No-Name');
		game.opening('TheOpening');
		game.openingSubVariation('TheSubVariation');
		game.result('*');
		return game;
	},

	'missing-headers-3': () => {
		const game = new Game();
		game.opening('TheOpening');
		return game;
	},

	'blank-headers-1': () => {
		const game = new Game();
		game.event('');
		game.round('');
		game.playerName('w', '');
		game.playerTitle('w', '');
		game.playerName('b', ' ');
		game.playerTitle('b', ' ');
		game.annotator('');
		game.mainVariation().comment('');
		game.result('*');
		return game;
	},

	'blank-headers-2': () => {
		const game = new Game();
		game.event(' ');
		game.round(' ');
		game.annotator(' ');
		game.mainVariation().comment(' ');
		game.result('*');
		return game;
	},

	'custom-initial-position-1': () => {
		const game = new Game();
		game.event('Custom initial position');
		game.initialPosition(new Position('8/2k5/p1P5/P1K5/8/8/8/8 w - - 0 60'), 60);
		game.mainVariation().play('Kd5').play('Kc8').play('Kd4').play('Kd8').play('Kc4').play('Kc8').play('Kd5').play('Kc7').play('Kc5').play('Kc8').play('Kb6').addNag(18);
		game.result('1-0');
		return game;
	},

	'custom-initial-position-2': () => {
		const game = new Game();
		game.event('Custom initial position (Black to play)');
		game.initialPosition(new Position('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4'), 4);
		game.mainVariation().play('O-O');
		return game;
	},

	'custom-initial-position-3': () => {
		const game = new Game();
		game.event('Custom initial position (canonical start position but non-canonical move number)');
		game.initialPosition(new Position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 3'), 3);
		game.mainVariation().play('e4');
		return game;
	},

	'variant-chess960': () => {
		const game = new Game();
		game.event('Chess game variant - Chess960');
		game.initialPosition(new Position('chess960', 'rnbqnkrb/pppppppp/8/8/8/8/PPPPPPPP/RNBQNKRB w KQkq - 0 1'));
		game.mainVariation().play('O-O');
		return game;
	},

	'variant-no-king': () => {
		const game = new Game();
		game.event('Chess game variant - No king');
		game.initialPosition(new Position('no-king', 'r7/8/8/8/8/8/8/7R w - - 0 1'));
		game.mainVariation().play('Rh8').play('Ra1').play('Ra8').play('Rh1').play('Ra1').play('Rh8').play('Rh1').play('Ra8');
		return game;
	},

	'variant-antichess': () => {
		const game = new Game();
		game.event('Chess game variant - Antichess');
		game.initialPosition(new Position('antichess'));
		return game;
	},

	'variant-horde': () => {
		const game = new Game();
		game.event('Chess game variant - Horde');
		game.initialPosition(new Position('horde'));
		return game;
	},

	'annotations-1': () => {
		const game = new Game();
		game.event('Game with annotations 1');
		game.annotator('Myself');

		let current = game.mainVariation().play('e4').play('e5').play('Bc4').play('Nc6').play('Qh5');
		current.comment('Threatening checkmate');
		current.tag('csl', 'Rf7');
		current.tag('cal', 'Gc4f7,Gh5f7');

		current = current.play('g6');
		current.comment('Avoid the checkmate');
		current.addNag(1);
		current.tag('cal', 'Rg6h5');

		const alternative = current.addVariation();
		alternative.comment('Other defenses are possible, for instance:');
		alternative.play('Nf6');

		current = current.play('Qf3');
		current.comment('I will be removed.');
		current.comment(undefined);

		game.annotator(null); // erase the annotator
		return game;
	},

	'annotations-2': () => {
		const game = new Game();
		game.event('Game with annotations 2');

		let current = game.mainVariation();
		current.comment('I will be removed.', true);
		current.comment(undefined);
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
		const alternative1 = current.addVariation();
		alternative1.comment('You should not see in PGN this since there is no move in the variation...');

		current = current.play('Bb4+');
		const alternative2 = current.addVariation();
		alternative2.comment('');

		current = current.play('Nc3');
		const alternative3 = current.addVariation();
		alternative3.comment(' ');

		current = current.play('O-O');
		current.tag('TheFirstTag', 'a[b]c');
		current.tag('TheOtherTag', ' ');

		return game;
	},

	'sub-variations': () => {
		const game = new Game();
		game.event('Game with variations and sub-variations');
		game.annotator('Myself');
		game.mainVariation().comment('I\'m the main variation header comment.');

		let current = game.mainVariation().play('e4').play('e5');
		current.addVariation().play('c6');
		current.addVariation().play('c5').play('Nc3').addVariation().play('Nf3').play('d6');
		current = current.play('Nf3');
		current.addVariation();
		current = current.play('Nc6').play('Bc4');

		let variation = current.addVariation();
		variation = variation.play('Bb5').play('a6');
		variation.addVariation().play('Nf6');
		variation = variation.play('Ba4');
		variation.addVariation().play('Bxc6').play('dxc6');

		game.annotator(undefined); // erase the annotator
		return game;
	},

	'escaped-text': () => {
		const game = new Game();
		game.event('Event with a \\ backslash');
		game.site('Site with " double-quotes');
		game.mainVariation().comment('Comment with \\ backslash and { some } braces...');
		return game;
	},

	'long-short-comments-variations-1': () => {
		const game = new Game();
		game.event('Game with long & short comments and variations 1.');
		game.mainVariation().comment('I\'m the main variation header (long) comment.', true);

		let current = game.mainVariation().play('e4');
		current.comment('I\'m a long comment.', true);

		current = current.play('e5');
		current.addVariation(true).play('c5').play('Nf3');

		current = current.play('Nf3').play('Nc6').play('Bc4');
		const alternative = current.addVariation(true);
		alternative.comment('I\'m a long comment too.', true);
		alternative.play('Bb5').play('a6').comment('I\'m a short comment.', false);

		current.play('Bc5').comment('I\'m a long comment at the end of the game.', true);
		return game;
	},

	'long-short-comments-variations-2': () => {
		const game = new Game();
		game.event('Game with long & short comments and variations 2.');
		game.mainVariation().comment('I\'m the main variation header (short) comment.', false);

		let current = game.mainVariation().play('e4');
		current.comment('I\'m a long comment with sub-variation siblings.', true);
		current.addVariation(false).play('d4').play('d5');

		current = current.play('e5').play('Nf3');
		current.addVariation(true).play('Nc3').comment('I\'m a long comment at the end of a variation.', true);

		current = current.play('Nc6').play('Bc4');
		current.addVariation(true).play('Bb5').play('a6');
		current.addVariation(false).play('d4');

		current = current.play('Bc5');
		const alternative = current.addVariation(true);
		alternative.comment('I\'m a long comment at the beginning of a variation.', true);
		alternative.play('d6');
		return game;
	},

	'long-short-comments-variations-3': () => {
		const game = new Game();
		game.event('Game with long & short comments and variations 3.');

		let current = game.mainVariation().play('e4');
		current.comment('I\'m a long comment with an empty sub-variation sibling.', true);
		current.addVariation();

		current = current.play('e5').play('Nf3');
		const alternative = current.addVariation(true);
		alternative.comment('I\'m a long variation followed by an empty variation.');
		alternative.play('Nc3');

		current.addVariation();
		current.play('Nc6');
		return game;
	},

	'shortened-variation': () => {
		const game = new Game();
		game.event('Game with shortened variation.');
		const node = game.mainVariation().play('e4');
		node.play('e5').play('Nf3');
		node.removeFollowingMoves();
		return game;
	},

	'cleared-variation': () => {
		const game = new Game();
		game.event('Game with cleared variation.');
		game.mainVariation().play('e4').play('e5').play('Nf3');
		game.mainVariation().clearMoves();
		return game;
	},

	'removed-variation': () => {
		const game = new Game();
		game.event('Game with removed variation.');
		const node = game.mainVariation().play('e4').play('e5');
		node.play('Nf3');
		node.addVariation().play('c5');
		node.addVariation().play('h5').comment('Will be removed');
		node.addVariation().play('c6');
		node.addVariation().play('e6');
		node.removeVariation(1);
		return game;
	},

	'swapped-variations': () => {
		const game = new Game();
		game.event('Game with swapped variations.');
		const node = game.mainVariation().play('e4').play('e5');
		node.play('Nf3');
		node.addVariation().play('c5');
		node.addVariation().play('c6').comment('Used to be at index 1');
		node.addVariation().play('d5');
		node.addVariation().play('f5');
		node.addVariation().play('g6').comment('Used to be at index 4');
		node.addVariation().play('b5');
		node.addVariation().play('a5');
		node.swapVariations(1, 4);
		return game;
	},

	'promoted-variation': () => {
		const game = new Game();
		game.event('Game with promoted variation.');
		const node = game.mainVariation().play('e4').play('e5');
		node.play('Nf3').comment('Used to be the main line');
		node.addVariation().play('c5');
		const newNode = node.addVariation().play('d5');
		newNode.play('exd5').play('Qxd5').comment('Used to be the variation at index 1');
		newNode.addVariation().play('d6').play('d4').comment('Used to be a nested variation');
		node.addVariation().play('c6');
		node.addVariation().play('g6');
		node.promoteVariation(1);
		return game;
	},
};

const fullPgnFactories = {

	'empty': () => [],

	'mini2': () => {

		const game0 = new Game();
		game0.event('TV Show');
		game0.date(new Date(2014, 0, 23));
		game0.playerName('w', 'Bill Gates');
		game0.playerName('b', 'Magnus Carlsen');
		game0.result('0-1');
		game0.mainVariation().play('e4').play('Nc6').play('Nf3').play('d5').play('Bd3').play('Nf6').play('exd5').play('Qxd5').play('Nc3').play('Qh5').play('O-O').play('Bg4').play('h3').play('Ne5').play('hxg4').play('Nfxg4').play('Nxe5').play('Qh2#');

		const game1 = new Game();
		game1.event('Sample game');
		game1.result('1-0');
		game1.mainVariation().play('e4').play('e5').play('Bc4').play('Nc6').play('Qh5').play('Nf6').play('Qxf7#');

		return [ game0, game1 ];
	}
};


describe('Check isVariation', () => {

	function checkNode(game, node) {

		// Check the current node.
		test.value(node.isVariation()).is(false);

		// Check the variations.
		for (const subVariation of node.variations()) {
			checkVariation(game, subVariation);
		}
	}

	function checkVariation(game, variation) {

		// Check the current variation.
		test.value(variation.isVariation()).is(true);

		// Check the moves.
		let node = variation.first();
		while (node !== undefined) {
			checkNode(game, node);
			node = node.next();
		}
	}

	function itCheckIsVariation(filename, factory) {
		it(filename, () => {
			const game = factory();
			checkVariation(game, game.mainVariation());
		});
	}

	for (const f in oneGamefactories) {
		itCheckIsVariation(f, oneGamefactories[f]);
	}
});


describe('Check IDs', () => {

	function checkNode(game, node) {

		// Check the current node.
		const nodeId = node.id();
		const searchedNode = game.findById(nodeId);
		test.value(searchedNode).isInstanceOf(AbstractNode);
		test.value(searchedNode).isInstanceOf(Node);
		test.value(searchedNode.id()).is(nodeId);
		test.value(searchedNode.positionBefore().fen()).is(node.positionBefore().fen());

		// Check the variations.
		for (const subVariation of node.variations()) {
			checkVariation(game, subVariation);
		}
	}

	function checkVariation(game, variation) {

		// Check the current variation.
		const variationId = variation.id();
		const searchedVariation = game.findById(variationId);
		test.value(searchedVariation).isInstanceOf(AbstractNode);
		test.value(searchedVariation).isInstanceOf(Variation);
		test.value(searchedVariation.id()).is(variationId);
		test.value(searchedVariation.initialPosition().fen()).is(variation.initialPosition().fen());

		// Check the moves.
		let node = variation.first();
		while (node !== undefined) {
			checkNode(game, node);
			node = node.next();
		}
	}

	function itCheckId(filename, factory) {
		it(filename, () => {
			const game = factory();
			checkVariation(game, game.mainVariation());
		});
	}

	for (const f in oneGamefactories) {
		itCheckId(f, oneGamefactories[f]);
	}
});


describe('Backward iterators', () => {

	function checkNode(parentVariation, previousNode, node) {

		// Check the parent variation.
		const actualParentVariation = node.parentVariation();
		test.value(actualParentVariation.id()).is(parentVariation.id());
		test.value(actualParentVariation.initialPosition().fen()).is(parentVariation.initialPosition().fen());

		// Check the previous node.
		const actualPreviousNode = node.previous();
		if (previousNode !== undefined) {
			test.value(actualPreviousNode.id()).is(previousNode.id());
			test.value(actualPreviousNode.positionBefore().fen()).is(previousNode.positionBefore().fen());
		}
		else {
			test.value(actualPreviousNode).isNotTrue();
		}

		// Check the variations.
		for (const subVariation of node.variations()) {
			checkVariation(node, subVariation);
		}
	}

	function checkVariation(parentNode, variation) {

		// Check the current variation.
		const actualParentNode = variation.parentNode();
		if (parentNode !== undefined) {
			test.value(actualParentNode.id()).is(parentNode.id());
			test.value(actualParentNode.positionBefore().fen()).is(parentNode.positionBefore().fen());
		}
		else {
			test.value(actualParentNode).isNotTrue();
		}

		// Check the moves.
		let node = variation.first();
		let previousNode = undefined;
		while (node !== undefined) {
			checkNode(variation, previousNode, node);
			previousNode = node;
			node = node.next();
		}
	}

	function itBackwardIterators(filename, factory) {
		it(filename, () => {
			const game = factory();
			checkVariation(undefined, game.mainVariation());
		});
	}

	for (const f in oneGamefactories) {
		itBackwardIterators(f, oneGamefactories[f]);
	}
});


describe('Game nodes', () => {

	function itGameNodes(filename, withSubVariations, factory) {
		it(filename + (withSubVariations ? ' (with sub-variations)' : ' (main variation only)'), () => {
			const resource = `games/${filename}/${withSubVariations ? 'nodes-all' : 'nodes-main'}.txt`;
			const expectedText = resourceExists(resource) ? readText(resource).trim() : '';
			const game = factory();
			const text = game.nodes(withSubVariations).map(node => `[${node.id()}] ${node.notation()}`).join('\n');
			test.value(text).is(expectedText);
		});
	}

	for (const f in oneGamefactories) {
		itGameNodes(f, false, oneGamefactories[f]);
		itGameNodes(f, true, oneGamefactories[f]);
	}
});


describe('Write ASCII', () => {

	function itAscii(filename, factory) {
		it(filename, () => {
			const expectedText = readText(`games/${filename}/ascii.txt`).trim();
			const game = factory();
			test.value(game.ascii().trim()).is(expectedText);
		});
	}

	for (const f in oneGamefactories) {
		itAscii(f, oneGamefactories[f]);
	}
});


describe('Write ASCII (extensive)', () => {

	function itAsciiExtensive(filename, factory) {
		it(filename, () => {
			const expectedText = readText(`games/${filename}/dump.txt`).trim();
			const game = factory();
			test.value(dumpGame(game).trim()).is(expectedText);
		});
	}

	for (const f in oneGamefactories) {
		itAsciiExtensive(f, oneGamefactories[f]);
	}
});


describe('Write PGN', () => {

	function itOneGamePgn(filename, factory) {
		it(filename, () => {
			const expectedText = readText(`games/${filename}/database.pgn`);
			const game = factory();
			test.value(pgnWrite(game)).is(expectedText);
		});
	}

	for (const f in oneGamefactories) {
		itOneGamePgn(f, oneGamefactories[f]);
	}

	function itFullPgn(filename, factory) {
		it('Full PGN - ' + filename, () => {
			const expectedText = readText(`pgns/${filename}.pgn`);
			const games = factory();
			test.value(pgnWrite(games)).is(expectedText);
		});
	}

	for (const f in fullPgnFactories) {
		itFullPgn(f, fullPgnFactories[f]);
	}
});


describe('Write PGN with options', () => {

	function itCheckOptions(filename, options) {
		it(filename, () => {
			const expectedText = readText(`games/${filename}/database-options.pgn`);
			const factory = oneGamefactories[filename];
			const game = factory();
			test.value(pgnWrite(game, options)).is(expectedText);
		});
	}

	itCheckOptions('base', { withPlyCount: true });
	itCheckOptions('custom-initial-position-1', { withPlyCount: true });
});


describe('Read PGN', () => {

	function itReadPgn(filename) {
		it(filename, () => {
			let resource = `games/${filename}/dump-clean.txt`;
			if (!resourceExists(resource)) {
				resource = `games/${filename}/dump.txt`;
			}
			const expectedText = readText(resource).trim();
			const inputText = readText(`games/${filename}/database.pgn`);
			const game = pgnRead(inputText, 0);
			test.value(dumpGame(game).trim()).is(expectedText);
		});
	}

	for (const f in oneGamefactories) {
		itReadPgn(f);
	}
});


describe('Game to POJO', () => {

	function itConvertToPOJO(filename, factory) {
		it(filename, () => {
			const expectedPOJO = JSON.parse(readText(`games/${filename}/pojo.json`).trim());
			const game = factory();
			test.value(game.pojo()).is(expectedPOJO);
		});
	}

	for (const f in oneGamefactories) {
		itConvertToPOJO(f, oneGamefactories[f]);
	}
});
