
const RPBChess = require('../src/core.js');
const test = require('unit.js');

describe('Square color', function() {

	const FILE = '12345678';
	const RANK = 'abcdefgh';

	it('Valid inputs', function() {
		for(var r=0; r<8; ++r) {
			for(var f=0; f<8; ++f) {
				var expected = f%2 === r%2 ? 'b' : 'w';
				var square = FILE[c] + RANK[r];
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
