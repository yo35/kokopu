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


var bt = require('./basetypes');
var exception = require('./exception');

var impl = require('./private_position/impl');
var fen = require('./private_position/fen');
var attacks = require('./private_position/attacks');
var legality = require('./private_position/legality');
var moveDescriptor = require('./private_position/movedescriptor');
var moveGeneration = require('./private_position/movegeneration');
var notation = require('./private_position/notation');



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
var Position = exports.Position = function() {
	if(arguments.length === 0 || arguments[0] === 'start') {
		this._impl = impl.makeInitial();
	}
	else if(arguments[0] === 'empty') {
		this._impl = impl.makeEmpty();
	}
	else if(arguments[0] instanceof Position) {
		this._impl = impl.makeCopy(arguments[0]._impl);
	}
	else if(typeof arguments[0] === 'string') {
		this._impl = fen.parseFEN(arguments[0], false).position;
	}
	else {
		throw new exception.IllegalArgument('Position()');
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

	if(arguments.length === 1) {
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
	if(arguments.length === 0) {
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

	if(arguments.length === 1) {
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
	if(arguments.length === 0) {
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
	return attacks.isAttacked(this._impl, square, byWho);
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
	return attacks.getAttacks(this._impl, square, byWho).map(bt.squareToString);
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
	return legality.isLegal(this._impl);
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
	legality.refreshLegalFlagAndKingSquares(this._impl);
	var square = this._impl.king[color];
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
	return moveGeneration.isCheck(this._impl);
};


/**
 * Return true if the player that is about to play is checkmated. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isCheckmate = function() {
	return moveGeneration.isCheckmate(this._impl);
};


/**
 * Return true if the player that is about to play is stalemated. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isStalemate = function() {
	return moveGeneration.isStalemate(this._impl);
};


/**
 * Detect if there exist any legal move in the current position. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.hasMove = function() {
	return moveGeneration.hasMove(this._impl);
};


/**
 * Return the list of all legal moves in the current position. An empty list is returned if the position itself is not legal.
 *
 * @returns {MoveDescriptor[]}
 */
Position.prototype.moves = function() {
	return moveGeneration.moves(this._impl);
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
	var result = moveGeneration.isMoveLegal(this._impl, from, to);

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

	// The result is either false or is a valid move descriptor.
	else {
		return result;
	}
};


/**
 * Play the given move if it is legal.
 *
 * @param {string|MoveDescriptor} move
 * @returns {boolean} `true` if the move has been played and if it is legal, `false` otherwise.
 */
Position.prototype.play = function(move) {
	if(typeof move === 'string') {
		try {
			moveGeneration.play(this._impl, notation.parseNotation(this._impl, move, false));
			return true;
		}
		catch(err) {
			if(err instanceof exception.InvalidNotation) {
				return false;
			}
			else {
				throw err;
			}
		}
	}
	else if(moveDescriptor.isInstanceOf(move)) {
		moveGeneration.play(this._impl, move);
		return true;
	}
	else {
		throw new exception.IllegalArgument('Position#play()');
	}
};


/**
 * Determine if a null-move (i.e. switching the player about to play) can be play in the current position.
 * A null-move is possible if the position is legal and if the current player about to play is not in check.
 *
 * @returns {boolean}
 */
Position.prototype.isNullMoveLegal = function() {
	return moveGeneration.isNullMoveLegal(this._impl);
};


/**
 * Play a null-move on the current position if it is legal.
 *
 * @returns {boolean} `true` if the move has actually been played, `false` otherwise.
 */
Position.prototype.playNullMove = function() {
	return moveGeneration.playNullMove(this._impl);
};



// -----------------------------------------------------------------------------
// Algebraic notation
// -----------------------------------------------------------------------------


/**
 * `notation(moveDescriptor)`: return the standard algebraic notation corresponding to the given move descriptor.
 *
 * `notation(string [, boolean])`: parse the given string as standard algebraic notation and return the corresponding move descriptor.
 *
 * @throws {InvalidNotation} If the move parsing fails or if the parsed move would correspond to an illegal move.
 */
Position.prototype.notation = function() {
	if(arguments.length === 1 && moveDescriptor.isInstanceOf(arguments[0])) {
		return notation.getNotation(this._impl, arguments[0]);
	}
	else if(arguments.length === 1 && typeof arguments[0] === 'string') {
		return notation.parseNotation(this._impl, arguments[0], false);
	}
	else if(arguments.length >= 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'boolean') {
		return notation.parseNotation(this._impl, arguments[0], arguments[1]);
	}
	else {
		throw new exception.IllegalArgument('Position#notation()');
	}
};
