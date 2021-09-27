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
var readCSV = require('./common/readcsv');
var test = require('unit.js');


function itForEach(fun) {
	readCSV('positions.csv', function(fields) {
		return {
			label       : fields[ 0],
			constructor : fields[ 1],
			variant     : fields[ 2],
			fen         : fields[ 3],
			turn        : fields[ 4],
			isLegal     : fields[ 5]==='true',
			whiteKing   : fields[ 6]==='-' ? false : fields[6],
			blackKing   : fields[ 7]==='-' ? false : fields[7],
			isCheck     : fields[ 8]==='true',
			isCheckmate : fields[ 9]==='true',
			isStalemate : fields[10]==='true',
			hasMove     : fields[11]==='true',
			moves       : fields[12],
			uciMoves    : fields[13],
			notations   : fields[14],
			successors  : fields[15]
		};
	}).forEach(function(elem) {
		it(elem.label, function() {
			fun(elem);
		});
	});
}


function createPosition(testDataDescriptor) {
	switch(testDataDescriptor.constructor) {
		case 'fen':
		case 'xfen':
			return new kokopu.Position(testDataDescriptor.variant, testDataDescriptor.fen);
		default:
			return new kokopu.Position(testDataDescriptor.variant, testDataDescriptor.constructor);
	}
}


describe('Variant getter', function() {
	itForEach(function(elem) {
		var pos = createPosition(elem);
		test.value(pos.variant()).is(elem.variant);
	});
});


describe('Turn getter', function() {
	itForEach(function(elem) {
		var pos = createPosition(elem);
		test.value(pos.turn()).is(elem.turn);
	});
});


describe('Legality check & king squares', function() {
	itForEach(function(elem) {
		var pos = createPosition(elem);
		test.value(pos.isLegal()).is(elem.isLegal);
		test.value(pos.kingSquare('w')).is(elem.whiteKing);
		test.value(pos.kingSquare('b')).is(elem.blackKing);
	});
});


describe('Check / checkmate / stalemate', function() {
	itForEach(function(elem) {
		var pos = createPosition(elem);
		test.value(pos.isCheck()).is(elem.isCheck);
		test.value(pos.isCheckmate()).is(elem.isCheckmate);
		test.value(pos.isStalemate()).is(elem.isStalemate);
		test.value(pos.hasMove()).is(elem.hasMove);
	});
});


describe('Move generation', function() {
	itForEach(function(elem) {
		var moves = createPosition(elem).moves().map(function(move) { return move.toString(); }).sort();
		test.value(moves.join('/')).is(elem.moves);
	});
});


describe('Move legality check', function() {
	itForEach(function(elem) {
		var moves = [];
		var pos = createPosition(elem);

		kokopu.forEachSquare(function(from) {
			kokopu.forEachSquare(function(to) {

				var moveDescriptor = pos.isMoveLegal(from, to);
				if(!moveDescriptor) {
					return;
				}

				switch(moveDescriptor.status) {

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

		test.value(moves.map(function(move) { return move.toString(); }).sort().join('/')).is(elem.moves);
	});
});


describe('Play', function() {
	itForEach(function(elem) {
		var initialPos = createPosition(elem);
		var moves = initialPos.moves().sort(function(e1, e2) { return e1.toString().localeCompare(e2.toString()); });
		var successors = moves.map(function(move) {
			var nextPos = new kokopu.Position(initialPos);
			nextPos.play(move);
			return nextPos.fen();
		});
		test.value(successors.join('|')).is(elem.successors);
	});
});


function notationGenerationTest(elem, expectedNotations, testedFunction) {
	var pos = createPosition(elem);
	var moves = pos.moves().sort(function(e1, e2) { return e1.toString().localeCompare(e2.toString()); });
	var actionNotations = moves.map(function(move) { return testedFunction(pos, move); });
	test.value(actionNotations.join('/')).is(expectedNotations);
}


describe('UCI notation generation', function() {
	itForEach(function(elem) {
		notationGenerationTest(elem, elem.uciMoves, function(pos, move) { return pos.uci(move); });
	});
});


describe('Standard algebraic notation generation', function() {
	itForEach(function(elem) {
		notationGenerationTest(elem, elem.notations, function(pos, move) { return pos.notation(move); });
	});
});


describe('Figurine notation generation', function() {

	var /* const */ WHITE_FIGURINES = { 'K':'\u2654', 'Q':'\u2655', 'R':'\u2656', 'B':'\u2657', 'N':'\u2658', 'P':'\u2659'};
	var /* const */ BLACK_FIGURINES = { 'K':'\u265a', 'Q':'\u265b', 'R':'\u265c', 'B':'\u265d', 'N':'\u265e', 'P':'\u265f'};

	itForEach(function(elem) {
		var figNotations = elem.notations.replace(/[KQRBNP]/g, function(val) { return elem.turn === 'w' ? WHITE_FIGURINES[val] : BLACK_FIGURINES[val]; });
		notationGenerationTest(elem, figNotations, function(pos, move) { return pos.figurineNotation(move); });
	});
});


describe('UCI notation parsing', function() {
	var /* const */ PROMO  = ['', 'k', 'q', 'r', 'b', 'n', 'p'];
	itForEach(function(elem) {
		var pos = createPosition(elem);
		var moves = [];

		// Try all the possible UCI notations...
		kokopu.forEachSquare(function(from) {
			kokopu.forEachSquare(function(to) {
				for(var p=0; p<PROMO.length; ++p) {
					var text = from + to + PROMO[p];
					try {
						var descriptor = pos.uci(text);
						moves.push(descriptor.toString());
					}
					catch(e) {
						if(!(e instanceof kokopu.exception.InvalidNotation)) {
							throw e;
						}
					}
				}
			});
		});

		// Sort the moves and remove the duplicates.
		moves.sort();
		moves = moves.filter(function(move, index, tab) { return index === 0 || move !== tab[index-1]; });

		test.value(moves.join('/')).is(elem.moves);
	});
});


function notationParsingTest(elem, testedPieces, testedPromos, testedFunction) {

	var /* const */ RANK_DISAMBIGUATION = ['', '1', '2', '3', '4', '5', '6', '7', '8'];
	var /* const */ FILE_DISAMBIGUATION = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	var pos = createPosition(elem);
	var moves = [];

	// Catch the exceptions thrown by the parsing function.
	function parseNotation(text) {
		try {
			var descriptor = testedFunction(pos, text);
			moves.push(descriptor.toString());
		}
		catch(e) {
			if(!(e instanceof kokopu.exception.InvalidNotation)) {
				throw e;
			}
		}
	}

	// Castling moves
	parseNotation('O-O-O');
	parseNotation('O-O');

	// Pawn move
	kokopu.forEachSquare(function(to) {
		for(var fd=0; fd<FILE_DISAMBIGUATION.length; ++fd) {
			for(var p=0; p<testedPromos.length; ++p) {
				var text = FILE_DISAMBIGUATION[fd] + to + testedPromos[p];
				parseNotation(text);
			}
		}
	});

	// Non-pawn moves
	kokopu.forEachSquare(function(to) {
		for(var p=0; p<testedPieces.length; ++p) {
			for(var rd=0; rd<RANK_DISAMBIGUATION.length; ++rd) {
				for(var fd=0; fd<FILE_DISAMBIGUATION.length; ++fd) {
					var text = testedPieces[p] + FILE_DISAMBIGUATION[fd] + RANK_DISAMBIGUATION[rd] + to;
					parseNotation(text);
				}
			}
		}
	});

	// Sort the moves and remove the duplicates.
	moves.sort();
	moves = moves.filter(function(move, index, tab) { return index === 0 || move !== tab[index-1]; });

	test.value(moves.join('/')).is(elem.moves);
}


describe('Standard algebraic notation parsing', function() {
	itForEach(function(elem) {
		notationParsingTest(elem, 'KQRBN', ['', 'K', 'Q', 'R', 'B', 'N', 'P'], function(pos, text) { return pos.notation(text, false); });
	});
});


describe('Figurine notation parsing', function() {
	itForEach(function(elem) {
		var testedPieces = elem.turn === 'w' ? '\u2654\u2655\u2656\u2657\u2658' : '\u265a\u265b\u265c\u265d\u265e';
		var testedPromos = elem.turn === 'w' ? ['', '\u2654', '\u2655', '\u2656', '\u2657', '\u2658', '\u2659'] :
			['', '\u265a', '\u265b', '\u265c', '\u265d', '\u265e', '\u265f'];
		notationParsingTest(elem, testedPieces, testedPromos, function(pos, text) { return pos.figurineNotation(text, false); });
	});
});
