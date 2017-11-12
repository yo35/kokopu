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


'use strict';


var exception = require('../exception');
var bt = require('./private/basetypes');
var impl = require('./private/impl');
var fen = require('./private/fen');



// -----------------------------------------------------------------------------
// Constructor & reset/clear
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
var Position = exports.Position = function(argument) {
	if(typeof argument === 'undefined' || argument === null || argument === 'start') {
		this._impl = impl.makeInitial();
	}
	else if(argument === 'empty') {
		this._impl = impl.makeEmpty();
	}
	else if(argument instanceof Position) {
		this._impl = impl.makeCopy(argument._impl);
	}
	else {
		this._impl = fen.parseFEN(argument, false).position;
	}
};


/**
 * Set the position to the empty state.
 */
Position.prototype.clear = function() {
	this._impl = impl.makeEmpty();
};


/**
 * Set the position to the starting state.
 */
Position.prototype.reset = function() {
	this._impl = impl.makeInitial();
};



// -----------------------------------------------------------------------------
// FEN & ASCII conversion
// -----------------------------------------------------------------------------


/**
 * Return a human-readable string representing the position. This string is multi-line,
 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
 *
 * @returns {string} Human-readable representation of the position.
 */
Position.prototype.ascii = function() {
	return fen.ascii(this._impl);
};


/**
 * `fen()` or `fen({fiftyMoveClock:number, fullMoveNumber:number})`: return the FEN representation of the position (getter behavior).
 *
 * `fen(string [, boolean])`: parse the given FEN string and set the position accordingly (setter behavior).
 */
Position.prototype.fen = function() {
	if(arguments.length === 0) {
		return fen.getFEN(this._impl, 0, 1);
	}
	else if(arguments.length === 1 && typeof arguments[0] === 'object') {
		var fiftyMoveClock = (typeof arguments[0].fiftyMoveClock === 'number') ? arguments[0].fiftyMoveClock : 0;
		var fullMoveNumber = (typeof arguments[0].fullMoveNumber === 'number') ? arguments[0].fullMoveNumber : 1;
		return fen.getFEN(this._impl, fiftyMoveClock, fullMoveNumber);
	}
	else if(arguments.length === 1 && typeof arguments[0] === 'string') {
		var result = fen.parseFEN(arguments[0], false);
		this._impl = result.position;
		return { fiftyMoveClock: result.fiftyMoveClock, fullMoveNumber: result.fullMoveNumber };
	}
	else if(arguments.length >= 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'boolean') {
		var result = fen.parseFEN(arguments[0], arguments[1]);
		this._impl = result.position;
		return { fiftyMoveClock: result.fiftyMoveClock, fullMoveNumber: result.fullMoveNumber };
	}
	else {
		throw new exception.IllegalArgument('Position#fen()');
	}
};



// -----------------------------------------------------------------------------
// Accessors
// -----------------------------------------------------------------------------


/**
 * Get/set the content of a square.
 *
 * @param {string} square `'e4'` for instance
 * @param {string} [value]
 */
Position.prototype.square = function(square, value) {
	square = bt.squareFromString(square);
	if(square < 0) {
		throw new exception.IllegalArgument('Position#square()');
	}

	if(typeof value === 'undefined' || value === null) {
		var cp = this._impl.board[square];
		return cp < 0 ? '-' : bt.coloredPieceToString(cp);
	}
	else if(value === '-') {
		this._impl.board[square] = bt.EMPTY;
		this._impl.legal = null;
	}
	else {
		var cp = bt.coloredPieceFromString(value);
		if(cp < 0) {
			throw new exception.IllegalArgument('Position#square()');
		}
		this._impl.board[square] = cp;
		this._impl.legal = null;
	}
};


/**
 * Get/set the turn flag.
 *
 * @param {string} [value]
 */
Position.prototype.turn = function(value) {
	if(typeof value === 'undefined' || value === null) {
		return bt.colorToString(this._impl.turn);
	}
	else {
		var turn = bt.colorFromString(value);
		if(turn < 0) {
			throw new exception.IllegalArgument('Position#turn()');
		}
		this._impl.turn = turn;
		this._impl.legal = null;
	}
};


/**
 * Get/set the castling rights. TODO: make it chess-960 compatible.
 *
 * @param {string} color
 * @param {string} side
 * @param {boolean} [value]
 */
Position.prototype.castling = function(castle, value) {
	if(!/^[wb][qk]$/.test(castle)) {
		throw new exception.IllegalArgument('Position#castling()');
	}
	var color = bt.colorFromString(castle[0]);
	var file = castle[1]==='k' ? 7 : 0;
	
	if(typeof value === 'undefined' || value === null) {
		return (this._impl.castling[color] /* jshint bitwise:false */ & (1 << file) /* jshint bitwise:true */) !== 0;
	}
	else if(value) {
		this._impl.castling[color] /* jshint bitwise:false */ |= 1 << file; /* jshint bitwise:true */
		this._impl.legal = null;
	}
	else {
		this._impl.castling[color] /* jshint bitwise:false */ &= ~(1 << file); /* jshint bitwise:true */
		this._impl.legal = null;
	}
};


/**
 * Get/set the en-passant flag.
 *
 * @param {string} [value]
 */
Position.prototype.enPassant = function(value) {
	if(typeof value === 'undefined' || value === null) {
		return this._impl.enPassant < 0 ? '-' : bt.fileToString(this._impl.enPassant);
	}
	else if(value === '-') {
		this._impl.enPassant = -1;
		this._impl.legal = null;
	}
	else {
		var enPassant = bt.fileFromString(value);
		if(enPassant < 0) {
			throw new exception.IllegalArgument('Position#enPassant()');
		}
		this._impl.enPassant = enPassant;
		this._impl.legal = null;
	}
};
