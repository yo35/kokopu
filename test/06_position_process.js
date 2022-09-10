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


const { exception, Position, forEachSquare } = require('../dist/lib/index');
const readCSV = require('./common/readcsv');
const test = require('unit.js');


function itForEach(fun) {
	const testData = readCSV('positions.csv', fields => {
		const label = fields[0].trim();
		if (label.length === 0 || label.charAt(0) === '#') {
			return false;
		}
		return {
			label              : label,
			constructor        : fields[ 1],
			variant            : fields[ 2],
			fen                : fields[ 3],
			turn               : fields[ 4],
			isLegal            : fields[ 5]==='true',
			whiteKing          : fields[ 6]==='-' ? false : fields[6],
			blackKing          : fields[ 7]==='-' ? false : fields[7],
			effectiveEnPassant : fields[ 8],
			isCheck            : fields[ 9]==='true',
			isCheckmate        : fields[10]==='true',
			isStalemate        : fields[11]==='true',
			hasMove            : fields[12]==='true',
			moves              : fields[13],
			uciMoves           : fields[14],
			notations          : fields[15],
			successors         : fields[16],
		};
	});

	for (const elem of testData) {
		if (elem) {
			it(elem.label, () => { fun(elem); });
		}
	}
}


function createPosition(testDataDescriptor) {
	switch (testDataDescriptor.constructor) {
		case 'fen':
		case 'xfen':
			return new Position(testDataDescriptor.variant, testDataDescriptor.fen);
		default:
			return new Position(testDataDescriptor.variant, testDataDescriptor.constructor);
	}
}


describe('Variant getter', () => {
	itForEach(elem => {
		const pos = createPosition(elem);
		test.value(pos.variant()).is(elem.variant);
	});
});


describe('Turn getter', () => {
	itForEach(elem => {
		const pos = createPosition(elem);
		test.value(pos.turn()).is(elem.turn);
	});
});


describe('Legality check & king squares', () => {
	itForEach(elem => {
		const pos = createPosition(elem);
		test.value(pos.isLegal()).is(elem.isLegal);
		test.value(pos.kingSquare('w')).is(elem.whiteKing);
		test.value(pos.kingSquare('b')).is(elem.blackKing);
	});
});


describe('Effective en-passant', () => {
	itForEach(elem => {
		const pos = createPosition(elem);
		test.value(pos.effectiveEnPassant()).is(elem.effectiveEnPassant);
	});
});


describe('Check / checkmate / stalemate', () => {
	itForEach(elem => {
		const pos = createPosition(elem);
		test.value(pos.isCheck()).is(elem.isCheck);
		test.value(pos.isCheckmate()).is(elem.isCheckmate);
		test.value(pos.isStalemate()).is(elem.isStalemate);
		test.value(pos.hasMove()).is(elem.hasMove);
	});
});


describe('Move generation', () => {
	itForEach(elem => {
		const moves = createPosition(elem).moves().map(move => move.toString()).sort();
		test.value(moves.join('/')).is(elem.moves);
	});
});


describe('Move legality check', () => {
	itForEach(elem => {
		const pos = createPosition(elem);
		const moves = [];

		forEachSquare(from => {
			forEachSquare(to => {

				const moveDescriptor = pos.isMoveLegal(from, to);
				if (!moveDescriptor) {
					return;
				}

				switch (moveDescriptor.status) {

					case 'regular':
						moves.push(moveDescriptor());
						break;

					case 'promotion':
						if (pos.variant() === 'antichess') {
							moves.push(moveDescriptor('k'));
						}
						moves.push(moveDescriptor('q'));
						moves.push(moveDescriptor('r'));
						moves.push(moveDescriptor('b'));
						moves.push(moveDescriptor('n'));
						break;

					default:
						break;
				}
			});
		});

		test.value(moves.map(move => move.toString()).sort().join('/')).is(elem.moves);
	});
});


describe('Play', () => {
	itForEach(elem => {
		const initialPos = createPosition(elem);
		const moves = initialPos.moves().sort((e1, e2) => e1.toString().localeCompare(e2.toString()));
		const successors = moves.map(move => {
			const nextPos = new Position(initialPos);
			nextPos.play(move);
			return nextPos.fen();
		});
		test.value(successors.join('|')).is(elem.successors);
	});
});


function notationGenerationTest(elem, expectedNotations, testedFunction) {
	const pos = createPosition(elem);
	const moves = pos.moves().sort((e1, e2) => e1.toString().localeCompare(e2.toString()));
	const actionNotations = moves.map(move => testedFunction(pos, move));
	test.value(actionNotations.join('/')).is(expectedNotations);
}


describe('UCI notation generation', () => {
	itForEach(elem => {
		notationGenerationTest(elem, elem.uciMoves, (pos, move) => pos.uci(move));
	});
});


describe('Standard algebraic notation generation', () => {
	itForEach(elem => {
		notationGenerationTest(elem, elem.notations, (pos, move) => pos.notation(move));
	});
});


describe('Figurine notation generation', () => {

	const WHITE_FIGURINES = { 'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659'};
	const BLACK_FIGURINES = { 'K': '\u265a', 'Q': '\u265b', 'R': '\u265c', 'B': '\u265d', 'N': '\u265e', 'P': '\u265f'};

	itForEach(elem => {
		const figNotations = elem.notations.replace(/[KQRBNP]/g, elem.turn === 'w' ? val => WHITE_FIGURINES[val] : val => BLACK_FIGURINES[val]);
		notationGenerationTest(elem, figNotations, (pos, move) => pos.figurineNotation(move));
	});
});


describe('UCI notation parsing', () => {
	const PROMO  = ['', 'k', 'q', 'r', 'b', 'n', 'p'];
	itForEach(elem => {
		const pos = createPosition(elem);
		let moves = [];

		// Try all the possible UCI notations...
		forEachSquare(from => {
			forEachSquare(to => {
				for (const promo of PROMO) {
					const text = from + to + promo;
					try {
						const descriptor = pos.uci(text);
						moves.push(descriptor.toString());
					}
					catch (e) {
						if (!(e instanceof exception.InvalidNotation)) {
							throw e;
						}
					}
				}
			});
		});

		// Sort the moves and remove the duplicates.
		moves.sort();
		moves = moves.filter((move, index, tab) => index === 0 || move !== tab[index-1]);

		test.value(moves.join('/')).is(elem.moves);
	});
});


function notationParsingTest(elem, testedPieces, testedPromos, testedFunction) {

	const RANK_DISAMBIGUATION = ['', '1', '2', '3', '4', '5', '6', '7', '8'];
	const FILE_DISAMBIGUATION = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	const pos = createPosition(elem);
	let moves = [];

	// Catch the exceptions thrown by the parsing function.
	function parseNotation(text) {
		try {
			const descriptor = testedFunction(pos, text);
			moves.push(descriptor.toString());
		}
		catch (e) {
			if (!(e instanceof exception.InvalidNotation)) {
				throw e;
			}
		}
	}

	// Castling moves
	parseNotation('O-O-O');
	parseNotation('O-O');

	// Pawn move
	forEachSquare(to => {
		for (const fd of FILE_DISAMBIGUATION) {
			for (const promo of testedPromos) {
				const text = fd + to + promo;
				parseNotation(text);
			}
		}
	});

	// Non-pawn moves
	forEachSquare(to => {
		for (const piece of testedPieces) {
			for (const rd of RANK_DISAMBIGUATION) {
				for (const fd of FILE_DISAMBIGUATION) {
					const text = piece + fd + rd + to;
					parseNotation(text);
				}
			}
		}
	});

	// Sort the moves and remove the duplicates.
	moves.sort();
	moves = moves.filter((move, index, tab) => index === 0 || move !== tab[index-1]);

	test.value(moves.join('/')).is(elem.moves);
}


describe('Standard algebraic notation parsing', () => {
	itForEach(elem => {
		notationParsingTest(elem, 'KQRBN', ['', 'K', 'Q', 'R', 'B', 'N', 'P'], (pos, text) => pos.notation(text, false));
	});
});


describe('Figurine notation parsing', () => {
	itForEach(elem => {
		const testedPieces = elem.turn === 'w' ? '\u2654\u2655\u2656\u2657\u2658' : '\u265a\u265b\u265c\u265d\u265e';
		const testedPromos = elem.turn === 'w' ? ['', '\u2654', '\u2655', '\u2656', '\u2657', '\u2658', '\u2659'] :
			['', '\u265a', '\u265b', '\u265c', '\u265d', '\u265e', '\u265f'];
		notationParsingTest(elem, testedPieces, testedPromos, (pos, text) => pos.figurineNotation(text, false));
	});
});
