/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chess, a JavaScript chess library.             *
 *    Copyright (C) 2017  Yoann Le Montagner <yo35 -at- melix.net>            *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


var exception = require('../exception');
var i18n = require('../i18n');
var internals = require('../internals');

var WHITE = internals.WHITE;
var BLACK = internals.BLACK;

var EMPTY = internals.EMPTY;
var INVALID = internals.INVALID;

var FEN_PIECE_SYMBOL = 'KkQqRrBbNnPp';


// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

/**
 * @constructor
 * @alias Position
 * @memberof RPBChess
 *
 * @classdesc
 * Represent a chess position, i.e. the state of a 64-square chessboard with a few additional
 * information (who is about to play, castling rights, en-passant rights).
 *
 * @param {string|Position} [fen = 'start'] Either `'start'`, `'empty'`, an existing position, or a FEN string representing chess position.
 * @throws InvalidFEN If the input parameter is neither a correctly formatted FEN string nor `'start'` or `'empty'`.
 */
var Position = exports.Position = function(fen) {
	if(typeof fen === 'undefined' || fen === null || fen === 'start') {
		this.reset();
	}
	else if(fen === 'empty') {
		this.clear();
	}
	else if(fen instanceof Position) {
		this._board     = fen._board.slice();
		this._turn      = fen._turn;
		this._castling  = fen._castling.slice();
		this._enPassant = fen._enPassant;
		this._legal     = fen._legal;
		this._king      = fen._king.slice();
	}
	else {
		setFEN(this, fen, false);
	}
}


/**
 * Set the position to the empty state.
 */
Position.prototype.clear = function() {

	// Board state
	this._board = [
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
	];

	// Flags
	this._turn      = WHITE;
	this._castling  = [0, 0];
	this._enPassant = -1;

	// Computed attributes
	this._legal = false;
	this._king  = [-1, -1];
};


/**
 * Set the position to the starting state.
 */
Position.prototype.reset = function() {

	// Board state
	this._board = [
		/*WR*/ 4, /*WN*/ 8, /*WB*/ 6, /*WQ*/ 2, /*WK*/ 0, /*WB*/ 6, /*WN*/ 8, /*WR*/ 4, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		/*WP*/10, /*WP*/10, /*WP*/10, /*WP*/10, /*WP*/10, /*WP*/10, /*WP*/10, /*WP*/10, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		/*BP*/11, /*BP*/11, /*BP*/11, /*BP*/11, /*BP*/11, /*BP*/11, /*BP*/11, /*BP*/11, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
		/*BR*/ 5, /*BN*/ 9, /*BB*/ 7, /*BQ*/ 3, /*BK*/ 1, /*BB*/ 7, /*BN*/ 9, /*BR*/ 5,
	];

	// Meta-data
	this._turn      = WHITE;
	this._castling  = [129 /* (1 << A-file) | (1 << H-file) */, 129];
	this._enPassant = -1;

	// Computed attributes
	this._legal = true;
	this._king  = [4 /* e1 */, 116 /* e8 */];
};


/**
 * Return a human-readable string representing the position. This string is multi-line,
 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
 *
 * @returns {string} Human-readable representation of the position.
 */
Position.prototype.ascii = function() {

	// Board scanning
	var res = '+---+---+---+---+---+---+---+---+\n';
	for(var r=7; r>=0; --r) {
		for(var f=0; f<8; ++f) {
			var cp = this._board[r*16 + f];
			res += '| ' + (cp < 0 ? ' ' : FEN_PIECE_SYMBOL[cp]) + ' ';
		}
		res += '|\n';
		res += '+---+---+---+---+---+---+---+---+\n';
	}

	// Flags
	res += internals.colorToString(this._turn) + ' ' + castlingToString(this) + ' ' + enPassantToString(this);

	// Return the result
	return res;
};


/**
 * `fen()` or `fen({fiftyMoveClock:number, fullMoveNumber:number})`: return the FEN representation of the position (getter behavior).
 *
 * `fen(string [, boolean])`: parse the given FEN string and set the position accordingly (setter behavior).
 */
Position.prototype.fen = function() {
	if(arguments.length === 0) {
		return getFEN(this, 0, 1);
	}
	else if(arguments.length === 1 && typeof arguments[0] === 'object') {
		var fiftyMoveClock = (typeof arguments[0].fiftyMoveClock === 'number') ? arguments[0].fiftyMoveClock : 0;
		var fullMoveNumber = (typeof arguments[0].fullMoveNumber === 'number') ? arguments[0].fullMoveNumber : 1;
		return getFEN(this, fiftyMoveClock, fullMoveNumber);
	}
	else if(arguments.length === 1 && typeof arguments[0] === 'string') {
		return setFEN(this, arguments[0], false);
	}
	else if(arguments.length >= 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'boolean') {
		return setFEN(this, arguments[0], arguments[1]);
	}
	else {
		throw new exception.IllegalArgument('Position#fen()');
	}
};



// -----------------------------------------------------------------------------
// FEN export
// -----------------------------------------------------------------------------

function getFEN(position, fiftyMoveClock, fullMoveNumber) {
	var res = '';

	// Board scanning
	for(var r=7; r>=0; --r) {
		var emptyCount = 0;
		for(var f=0; f<8; ++f) {
			var cp = position._board[r*16 + f];
			if(cp < 0) {
				++emptyCount;
			}
			else {
				if(emptyCount > 0) {
					res += emptyCount;
					emptyCount = 0;
				}
				res += FEN_PIECE_SYMBOL[cp];
			}
		}
		if(emptyCount > 0) {
			res += emptyCount;
		}
		if(r > 0) {
			res += '/';
		}
	}

	// Flags + additional move counters
	res += ' ' + internals.colorToString(position._turn) + ' ' + castlingToString(position) + ' ' + enPassantToString(position);
	res += ' ' + fiftyMoveClock + ' ' + fullMoveNumber;

	// Return the result
	return res;
}


function castlingToString(position) {
	var res = '';
	if(position._castling[WHITE] /* jshint bitwise:false */ & 1<<7 /* jshint bitwise:true */) { res += 'K'; }
	if(position._castling[WHITE] /* jshint bitwise:false */ & 1<<0 /* jshint bitwise:true */) { res += 'Q'; }
	if(position._castling[BLACK] /* jshint bitwise:false */ & 1<<7 /* jshint bitwise:true */) { res += 'k'; }
	if(position._castling[BLACK] /* jshint bitwise:false */ & 1<<0 /* jshint bitwise:true */) { res += 'q'; }
	return res === '' ? '-' : res;
}


function enPassantToString(position) {
	if(position._enPassant < 0) {
		return '-';
	}
	else {
		return internals.fileToString(position._enPassant) + (position._turn===WHITE ? '6' : '3');
	}
}



// -----------------------------------------------------------------------------
// FEN import
// -----------------------------------------------------------------------------

function setFEN(position, fen, strict) {

	// Trim the input string and split it into 6 fields.
	fen = fen.replace(/^\s+|\s+$/g, '');
	var fields = fen.split(/\s+/);
	if(fields.length !== 6) {
		throw new exception.InvalidFEN(fen, i18n.WRONG_NUMBER_OF_FEN_FIELDS);
	}

	// The first field (that represents the board) is split in 8 sub-fields.
	var rankFields = fields[0].split('/');
	if(rankFields.length !== 8) {
		throw new exception.InvalidFEN(fen, i18n.WRONG_NUMBER_OF_SUBFIELDS_IN_BOARD_FIELD);
	}

	// Initialize the position
	position.clear();
	position._legal = null;

	// Board parsing
	for(var r=7; r>=0; --r) {
		var rankField = rankFields[7-r];
		var i = 0;
		var f = 0;
		while(i<rankField.length && f<8) {
			var s = rankField[i];
			var cp = FEN_PIECE_SYMBOL.indexOf(s);

			// The current character is in the range [1-8] -> skip the corresponding number of squares.
			if(/^[1-8]$/.test(s)) {
				f += parseInt(s, 10);
			}

			// The current character corresponds to a colored piece symbol -> set the current square accordingly.
			else if(cp >= 0) {
				position._board[r*16 + f] = cp;
				++f;
			}

			// Otherwise -> parsing error.
			else {
				throw new exception.InvalidFEN(fen, i18n.UNEXPECTED_CHARACTER_IN_BOARD_FIELD, s);
			}

			// Increment the character counter.
			++i;
		}

		// Ensure that the current sub-field deals with all the squares of the current rank.
		if(i !== rankField.length || f !== 8) {
			throw new exception.InvalidFEN(fen, i18n.UNEXPECTED_END_OF_SUBFIELD_IN_BOARD_FIELD, i18n.ORDINALS[7-r]);
		}
	}

	// Turn parsing
	position._turn = internals.colorFromString(fields[1]);
	if(position._turn < 0) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_TURN_FIELD);
	}

	// Castling rights parsing
	position._castling = castlingFromString(fields[2], strict);
	if(position._castling === null) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_CASTLING_FIELD);
	}

	// En-passant rights parsing
	var enPassantField = fields[3];
	if(enPassantField !== '-') {
		if(!/^[a-h][36]$/.test(enPassantField)) {
			throw new exception.InvalidFEN(fen, i18n.INVALID_EN_PASSANT_FIELD);
		}
		if(strict && ((enPassantField[1]==='3' && position._turn===WHITE) || (enPassantField[1]==='6' && position._turn===BLACK))) {
			throw new exception.InvalidFEN(fen, i18n.WRONG_RANK_IN_EN_PASSANT_FIELD);
		}
		position._enPassant = internals.fileFromString(enPassantField[0]);
	}

	// Move counting flags parsing
	var moveCountingRegExp = strict ? /^(?:0|[1-9][0-9]*)$/ : /^[0-9]+$/;
	if(!moveCountingRegExp.test(fields[4])) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_MOVE_COUNTING_FIELD, i18n.ORDINALS[4]);
	}
	if(!moveCountingRegExp.test(fields[5])) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_MOVE_COUNTING_FIELD, i18n.ORDINALS[5]);
	}
	return { fiftyMoveClock: parseInt(fields[4], 10), fullMoveNumber: parseInt(fields[5], 10) };
}


function castlingFromString(castling, strict) {
	var res = [0, 0];
	if(castling === '-') {
		return res;
	}
	if(!(strict ? /^K?Q?k?q?$/ : /^[KQkq]*$/).test(castling)) {
		return null;
	}
	if(castling.indexOf('K') >= 0) { res[WHITE] /* jshint bitwise:false */ |= 1<<7; /* jshint bitwise:true */ }
	if(castling.indexOf('Q') >= 0) { res[WHITE] /* jshint bitwise:false */ |= 1<<0; /* jshint bitwise:true */ }
	if(castling.indexOf('k') >= 0) { res[BLACK] /* jshint bitwise:false */ |= 1<<7; /* jshint bitwise:true */ }
	if(castling.indexOf('q') >= 0) { res[BLACK] /* jshint bitwise:false */ |= 1<<0; /* jshint bitwise:true */ }
	return res;
}
