
const RPBChess = require('../src/core.js');
const test = require('unit.js');

describe('Square color', function() {

	const ROW    = '12345678';
	const COLUMN = 'abcdefgh';

	it('Valid inputs', function() {
		for(var r=0; r<8; ++r) {
			for(var c=0; c<8; ++c) {
				var expected = c%2 === r%2 ? 'b' : 'w';
				var square = COLUMN[c] + ROW[r];
				test.value(RPBChess.squareColor(square)).is(expected);
			}
		}
	});

	['e9', 'i5'].forEach(function(elem) {
		it('Error with ' + elem, function() {
			test.exception(function() { RPBChess.squareColor(elem); }).isInstanceOf(RPBChess.exception.IllegalArgument);
		});
	});

});
