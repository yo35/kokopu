/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018  Yoann Le Montagner <yo35 -at- melix.net>            *
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


var kokopu = require('../index');
var readCSV = require('./common/readcsv');
var test = require('unit.js');


function testData() {
	return readCSV('positions.csv', function(fields) {
		return {
			label      : fields[ 0],
			constructor: fields[ 1],
			fen        : fields[ 2],
			isLegal    : fields[ 3]==='true',
			whiteKing  : fields[ 4],
			blackKing  : fields[ 5],
			isCheck    : fields[ 6]==='true',
			isCheckmate: fields[ 7]==='true',
			isStalemate: fields[ 8]==='true',
			hasMove    : fields[ 9]==='true',
			moves      : fields[10],
			notations  : fields[11],
			successors : fields[12]
		};
	});
}


function createPosition(testDataDescriptor) {
	return new kokopu.Position(testDataDescriptor.constructor==='fen' ? testDataDescriptor.fen : testDataDescriptor.constructor);
}


describe('isAttacked', function() {

	function testIsAttacked(fen, byWho, attackedSquares) {
		var position = new kokopu.Position(fen);
		var res = '';
		kokopu.forEachSquare(function(square) {
			if(position.isAttacked(square, byWho)) {
				if(res !== '') { res += '/'; }
				res += square;
			}
		});
		test.value(res).is(attackedSquares);
	}

	it('King attacks'      , function() { testIsAttacked('8/8/8/4K3/8/8/8/8 w - - 0 1', 'w', 'd4/e4/f4/d5/f5/d6/e6/f6'); });
	it('Queen attacks'     , function() { testIsAttacked('8/8/8/4q3/8/8/8/8 w - - 0 1', 'b', 'a1/e1/b2/e2/h2/c3/e3/g3/d4/e4/f4/a5/b5/c5/d5/f5/g5/h5/d6/e6/f6/c7/e7/g7/b8/e8/h8'); });
	it('Rook attacks'      , function() { testIsAttacked('8/8/8/4R3/8/8/8/8 w - - 0 1', 'w', 'e1/e2/e3/e4/a5/b5/c5/d5/f5/g5/h5/e6/e7/e8'); });
	it('Bishop attacks'    , function() { testIsAttacked('8/8/8/4b3/8/8/8/8 w - - 0 1', 'b', 'a1/b2/h2/c3/g3/d4/f4/d6/f6/c7/g7/b8/h8'); });
	it('Knight attacks'    , function() { testIsAttacked('8/8/8/4N3/8/8/8/8 w - - 0 1', 'w', 'd3/f3/c4/g4/c6/g6/d7/f7'); });
	it('White pawn attacks', function() { testIsAttacked('8/8/8/4P3/8/8/8/8 w - - 0 1', 'w', 'd6/f6'); });
	it('Black pawn attacks', function() { testIsAttacked('8/8/8/4p3/8/8/8/8 w - - 0 1', 'b', 'd4/f4'); });

});


describe('Legality check & king squares', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var pos = createPosition(elem);
			test.value(pos.isLegal()).is(elem.isLegal);
			test.value(pos.kingSquare('w')).is(elem.whiteKing);
			test.value(pos.kingSquare('b')).is(elem.blackKing);
		});
	});
});


describe('Check / checkmate / stalemate', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var pos = createPosition(elem);
			test.value(pos.isCheck()).is(elem.isCheck);
			test.value(pos.isCheckmate()).is(elem.isCheckmate);
			test.value(pos.isStalemate()).is(elem.isStalemate);
			test.value(pos.hasMove()).is(elem.hasMove);
		});
	});
});


describe('Move generation', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var moves = createPosition(elem).moves().map(function(elem) { return elem.toString(); }).sort();
			test.value(moves.join('/')).is(elem.moves);
		});
	});
});


describe('Move legality check', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var moves = [];
			var pos = createPosition(elem);

			kokopu.forEachSquare(function(from) {
				kokopu.forEachSquare(function(to) {

					var moveDescriptor = pos.isMoveLegal(from, to);
					if(!moveDescriptor) {
						return;
					}

					if(moveDescriptor.needPromotion) {
						moves.push(moveDescriptor('q'));
						moves.push(moveDescriptor('r'));
						moves.push(moveDescriptor('b'));
						moves.push(moveDescriptor('n'));
					}
					else {
						moves.push(moveDescriptor);
					}
				});
			});

			test.value(moves.map(function(elem) { return elem.toString(); }).sort().join('/')).is(elem.moves);
		});
	});
});


describe('Play', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
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
});


describe('Algebraic notation generation', function() {
	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var pos = createPosition(elem);
			var moves = pos.moves().sort(function(e1, e2) { return e1.toString().localeCompare(e2.toString()); });
			var notations = moves.map(function(move) { return pos.notation(move); });
			test.value(notations.join('/')).is(elem.notations);
		});
	});
});


describe('Algebraic notation parsing', function() {

	var /* const */ PIECES = 'KQRBN';
	var /* const */ PROMO  = ['', 'Q', 'R', 'B', 'N'];
	var /* const */ RANK_DISAMBIGUATION = ['', '1', '2', '3', '4', '5', '6', '7', '8'];
	var /* const */ FILE_DISAMBIGUATION = ['', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	testData().forEach(function(elem) {
		it('Position ' + elem.label, function() {
			var pos = createPosition(elem);
			var moves = [];

			// Catch the exceptions thrown by the parsing function.
			function parseNotation(text) {
				try {
					var descriptor = pos.notation(text, false);
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
					for(var p=0; p<PROMO.length; ++p) {
						var text = FILE_DISAMBIGUATION[fd] + to + PROMO[p];
						parseNotation(text);
					}
				}
			});

			// Non-pawn moves
			kokopu.forEachSquare(function(to) {
				for(var p=0; p<PIECES.length; ++p) {
					for(var rd=0; rd<RANK_DISAMBIGUATION.length; ++rd) {
						for(var fd=0; fd<FILE_DISAMBIGUATION.length; ++fd) {
							var text = PIECES[p] + FILE_DISAMBIGUATION[fd] + RANK_DISAMBIGUATION[rd] + to;
							parseNotation(text);
						}
					}
				}
			});

			// Sort the moves and remove the duplicates.
			moves.sort();
			moves = moves.filter(function(elem, index, tab) { return index===0 || elem!==tab[index-1]; });

			test.value(moves.join('/')).is(elem.moves);
		});
	});
});
