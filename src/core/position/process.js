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
var Position = require('./init').Position;

var bt = require('./private/basetypes');
var attacks = require('./private/attacks');
var legality = require('./private/legality');
var moveGeneration = require('./private/movegeneration');



// -----------------------------------------------------------------------------
// Attacks
// -----------------------------------------------------------------------------


/**
 * Check if any piece of the given color attacks a given square.
 *
 * @param {string} square
 * @param {string} byWho Either `'w'` or `'b'`
 * @returns {boolean}
 */
Position.prototype.isAttacked = function(square, byWho) {
	square = bt.squareFromString(square);
	byWho = bt.colorFromString(byWho);
	if(square < 0 || byWho < 0) {
		throw new exception.IllegalArgument('Position#isAttacked()');
	}
	return attacks.isAttacked(this, square, byWho);
};


/**
 * Return the squares from which a piece of the given color attacks a given square.
 *
 * @param {string} square
 * @param {string} byWho Either `'w'` or `'b'`
 * @returns {boolean}
 */
Position.prototype.getAttacks = function(square, byWho) {
	square = bt.squareFromString(square);
	byWho = bt.colorFromString(byWho);
	if(square < 0 || byWho < 0) {
		throw new exception.IllegalArgument('Position#getAttacks()');
	}
	return attacks.getAttacks(this, square, byWho).map(bt.squareToString);
};



// -----------------------------------------------------------------------------
// Legality
// -----------------------------------------------------------------------------


/**
 * Check whether the current position is legal or not.
 *
 * A position is considered to be legal if all the following conditions are met:
 *
 *  1. There is exactly one white king and one black king on the board.
 *  2. The player that is not about to play is not check.
 *  3. There are no pawn on rows 1 and 8.
 *  4. For each colored castle flag set, there is a rook and a king on the
 *     corresponding initial squares.
 *  5. The pawn situation is consistent with the en-passant flag if it is set.
 *     For instance, if it is set to the 'e' column and black is about to play,
 *     the squares e2 and e3 must be empty, and there must be a white pawn on e4.
 *
 * @returns {boolean}
 */
Position.prototype.isLegal = function() {
	return legality.isLegal(this);
};


/**
 * Return the square on which is located the king of the given color.
 *
 * @param {string} color
 * @returns {string} Square where is located the searched king. `'-'` is returned
 *          if there is no king of the given color or if the are 2 such kings or more.
 */
Position.prototype.kingSquare = function(color) {
	color = bt.colorFromString(color);
	if(color < 0) {
		throw new exception.IllegalArgument('Position#kingSquare()');
	}
	legality.refreshLegalFlagAndKingSquares(this);
	var square = this._king[color];
	return square < 0 ? '-' : bt.squareToString(square);
};



// -----------------------------------------------------------------------------
// Move generation
// -----------------------------------------------------------------------------


/**
 * Return true if the player that is about to play is in check. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isCheck = function() {
	return moveGeneration.isCheck(this);
};


/**
 * Return true if the player that is about to play is checkmated. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isCheckmate = function() {
	return moveGeneration.isCheckmate(this);
};


/**
 * Return true if the player that is about to play is stalemated. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isStalemate = function() {
	return moveGeneration.isStalemate(this);
};


/**
 * Detect if there exist any legal move in the current position. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.hasMove = function() {
	return moveGeneration.hasMove(this);
};


/**
 * Return the list of all legal moves in the current position. An empty list is returned if the position itself is not legal.
 *
 * @returns {MoveDescriptor[]}
 */
Position.prototype.moves = function() {
	return moveGeneration.moves(this);
};


/**
 * Whether a move is legal or not.
 *
 * @returns {false|MoveDescriptor|function}
 */
Position.prototype.isMoveLegal = function(from, to) {
	from = bt.squareFromString(from);
	to = bt.squareFromString(to);
	if(from < 0 || to < 0) {
		throw new exception.IllegalArgument('Position#isMoveLegal()');
	}
	var result = moveGeneration.isMoveLegal(this, from, to);

	// A promoted piece needs to be chosen to build a valid move descriptor.
	if(typeof result === 'function') {
		var builder = function(promotion) {
			promotion = bt.pieceFromString(promotion);
			if(promotion >= 0) {
				var builtMoveDescriptor = result(promotion);
				if(builtMoveDescriptor) {
					return builtMoveDescriptor;
				}
			}
			throw new exception.IllegalArgument('Position#isMoveLegal()');
		};
		builder.needPromotion = true;
		return builder;
	}

	// Either the result is false or is a valid move descriptor.
	else {
		return result;
	}
};
