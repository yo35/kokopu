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
var internals = require('../internals');

var WHITE = internals.WHITE;
var BLACK = internals.BLACK;

var EMPTY = internals.EMPTY;

var Position = require('./init').Position;



// -----------------------------------------------------------------------------
// Board
// -----------------------------------------------------------------------------

/**
 * Get/set the content of a square.
 *
 * @param {string} square `'e4'` for instance
 * @param {string} [value]
 */
Position.prototype.square = function(square, value) {
	square = internals.squareFromString(square);
	if(square < 0) {
		throw new exception.IllegalArgument('Position#square()');
	}

	if(typeof value === 'undefined' || value === null) {
		return getSquare(this, square);
	}
	else if(!setSquare(this, square, value)) {
		throw new exception.IllegalArgument('Position#square()');
	}
};


function getSquare(position, square) {
	var cp = position._board[square];
	return cp < 0 ? '-' : internals.coloredPieceToString(cp);
}


function setSquare(position, square, value) {
	if(value === '-') {
		position._board[square] = EMPTY;
		position._legal = null;
		return true;
	}
	else {
		var cp = internals.coloredPieceFromString(value);
		if(cp >= 0) {
			position._board[square] = cp;
			position._legal = null;
			return true;
		}
	}
	return false;
}



// -----------------------------------------------------------------------------
// Turn
// -----------------------------------------------------------------------------

/**
 * Get/set the turn flag.
 *
 * @param {string} [value]
 */
Position.prototype.turn = function(value) {
	if(typeof value === 'undefined' || value === null) {
		return getTurn(this);
	}
	else if(!setTurn(this, value)) {
		throw new exception.IllegalArgument('Position#turn()');
	}
};


function getTurn(position) {
	return internals.colorToString(position._turn);
}


function setTurn(position, value) {
	var turn = internals.colorFromString(value);
	if(turn < 0) {
		return false;
	}
	
	position._turn = turn;
	position._legal = null;
	return true;
}



// -----------------------------------------------------------------------------
// Castling
// -----------------------------------------------------------------------------

/**
 * Get/set the castle rights. TODO: make it chess-960 compatible.
 *
 * @param {string} color
 * @param {string} side
 * @param {boolean} [value]
 */
Position.prototype.castling = function(castle, value) {
	if(!/^[wb][qk]$/.test(castle)) {
		throw new exception.IllegalArgument('Position#castleRights()');
	}
	var color = internals.colorFromString(castle[0]);
	var file = castle[1]==='k' ? 7 : 0;
	
	if(typeof value === 'undefined' || value === null) {
		return getCastling(this, color, file);
	}
	else if(!setCastling(this, color, file, value)) {
		throw new exception.IllegalArgument('Position#castleRights()');
	}
};


function getCastling(position, color, file) {
	return (position._castling[color] /* jshint bitwise:false */ & (1 << file) /* jshint bitwise:true */) !== 0;
}


function setCastling(position, color, file, value) {
	if(typeof value === 'boolean') {
		if(value) {
			position._castling[color] /* jshint bitwise:false */ |= 1 << file; /* jshint bitwise:true */
		}
		else {
			position._castling[color] /* jshint bitwise:false */ &= ~(1 << file); /* jshint bitwise:true */
		}
		position._legal = null;
		return true;
	}
	return false;
}



// -----------------------------------------------------------------------------
// En-passant
// -----------------------------------------------------------------------------

/**
 * Get/set the en-passant flag.
 *
 * @param {string} [value]
 */
Position.prototype.enPassant = function(value) {
	if(typeof value === 'undefined' || value === null) {
		return getEnPassant(this);
	}
	else if(!setEnPassant(this, value)) {
		throw new exception.IllegalArgument('Position#enPassant()');
	}
};


function getEnPassant(position) {
	return position._enPassant < 0 ? '-' : internals.fileToString(position._enPassant);
}


function setEnPassant(position, value) {
	if(value === '-') {
		position._enPassant = -1;
		position._legal = null;
		return true;
	}
	else {
		var enPassant = internals.fileFromString(value);
		if(enPassant >= 0) {
			position._enPassant = enPassant;
			position._legal = null;
			return true;
		}
	}
	return false;
}
