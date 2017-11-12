/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chessboard, a WordPress plugin.                *
 *    Copyright (C) 2013-2017  Yoann Le Montagner <yo35 -at- melix.net>       *
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


var i18n = require('./core/i18n');
var exception = require('./core/exception');
var internals = require('./core/position/private/basetypes');
var attacks = require('./core/position/private/attacks');



// ---------------------------------------------------------------------------
// Internal constants and helper methods
// ---------------------------------------------------------------------------



/**
 * Return the color of a square.
 *
 * @param {string} square
 * @returns {string} Either `'w'` or `'b'`.
 */
function squareColor(square) {
	if(typeof square === 'string') {
		if     (/^[aceg][1357]$/.test(square) || /^[bdfh][2468]$/.test(square)) { return 'b'; }
		else if(/^[aceg][2468]$/.test(square) || /^[bdfh][1357]$/.test(square)) { return 'w'; }
	}
	throw new exception.IllegalArgument('squareColor()');
}


/**
 * Return the coordinates of a square.
 *
 * @param {string} square
 * @returns {{r:number, c:number}}
 */
function squareToCoordinates(square) {
	square = internals.squareFromString(square);
	return square >= 0 ? { r:Math.floor(square/16), f:square%16 } : null;
}



// ---------------------------------------------------------------------------
// Constructor & string conversion methods
// ---------------------------------------------------------------------------

var Position = require('./core/position/init').Position;



// ---------------------------------------------------------------------------
// Square control & position legality
// ---------------------------------------------------------------------------


var isAttacked = attacks.isAttacked;



// ---------------------------------------------------------------------------
// Move generation & check/checkmate/stalemate tests
// ---------------------------------------------------------------------------


/**
 * Determine if a null-move (i.e. switching the player about to play) can be play in the current position.
 * A null-move is possible if the position is legal and if the current player about to play is not in check.
 *
 * @returns {boolean}
 */
Position.prototype.isNullMoveLegal = function() {
	return this.isLegal() && !isAttacked(this, this._king[this._turn], 1-this._turn);
};


/**
 * Play a null-move on the current position if it is legal.
 *
 * @returns {boolean} `true` if the move has actually been played, `false` otherwise.
 */
Position.prototype.playNullMove = function() {
	if(this.isNullMoveLegal()) {
		this._turn      = 1 - this._turn;
		this._enPassant = -1;
		return true;
	}
	else {
		return false;
	}
};



// ---------------------------------------------------------------------------
// Public objects
// ---------------------------------------------------------------------------


exports.i18n = i18n;
exports.exception = exception;
exports.squareColor = squareColor;
exports.squareToCoordinates = squareToCoordinates;
exports.Position = Position;
