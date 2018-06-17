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


var bt = require('./basetypes');
var moveDescriptor = require('./movedescriptor');
var exception = require('./exception');

var impl = require('./private_position/impl');
var fen = require('./private_position/fen');
var attacks = require('./private_position/attacks');
var legality = require('./private_position/legality');
var moveGeneration = require('./private_position/movegeneration');
var notation = require('./private_position/notation');



// -----------------------------------------------------------------------------
// Constructor & reset/clear
// -----------------------------------------------------------------------------

/**
 * @class
 * @classdesc Represent a chess position, i.e. the state of a 64-square chessboard with a few additional
 *            information (who is about to play, castling rights, en-passant rights).
 *
 * @param {string|Position} [fen = 'start'] Either `'start'`, `'empty'`, a FEN string representing a chess position,
 *        an existing {@link Position} object.
 * @throws {module:exception.InvalidFEN} If the input parameter is neither a correctly formatted FEN string nor `'start'` or `'empty'`.
 */
var Position = exports.Position = function() {

	// Copy constructor
	if(arguments[0] instanceof Position) {
		this._impl = impl.makeCopy(arguments[0]._impl);
	}

	// Special constructor codes
	else if(arguments.length === 0 || arguments[0] === 'start' || (arguments[0] === 'regular' && arguments[1] === 'start')) {
		this._impl = impl.makeInitial();
	}
	else if(arguments[0] === 'empty' || (arguments[0] === 'regular' && arguments[1] === 'empty')) {
		this._impl = impl.makeEmpty(bt.REGULAR_CHESS);
	}
	else if(arguments[0] === 'chess960' && arguments[1] === 'empty') {
		this._impl = impl.makeEmpty(bt.CHESS_960);
	}
	else if(arguments[0] === 'chess960' && typeof arguments[1] === 'number' && arguments[1] >= 0 && arguments[1] <= 959) {
		this._impl = impl.make960FromScharnagl(arguments[1]);
	}

	// FEN parsing
	else if(arguments[0] === 'regular' || arguments[0] === 'chess960') {
		if(typeof arguments[1] === 'string') {
			this._impl = fen.parseFEN(bt.variantFromString(arguments[0]), arguments[1], false).position;
		}
		else {
			throw new exception.IllegalArgument('Position()');
		}
	}
	else {
		if(typeof arguments[0] === 'string') {
			this._impl = fen.parseFEN(bt.REGULAR_CHESS, arguments[0], false).position;
		}
		else {
			throw new exception.IllegalArgument('Position()');
		}
	}
};


/**
 * Set the position to the empty state.
 */
Position.prototype.clear = function() {
	this._impl = impl.makeEmpty(this._impl.variant);
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
 * Get the FEN representation of the current {@link Position}).
 *
 * @param {{fiftyMoveClock:number, fullMoveNumber:number}} [options] If not provided the `fiftyMoveClock`
 *        and the `fullMoveNumber` fields of the returned FEN string are set respectively to 0 and 1.
 *
 *//**
 *
 * Parse the given FEN string and set the position accordingly.
 *
 * @param {string} fen
 * @param {boolean} [strict=false] If `true`, only perfectly formatted FEN strings are accepted.
 * @returns {{fiftyMoveClock:number, fullMoveNumber:number}}
 * @throws {module:exception.InvalidFEN} If the given string cannot be parsed as a valid FEN string.
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
		var result = fen.parseFEN(this._impl.variant, arguments[0], false);
		this._impl = result.position;
		return { fiftyMoveClock: result.fiftyMoveClock, fullMoveNumber: result.fullMoveNumber };
	}
	else if(arguments.length >= 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'boolean') {
		var result = fen.parseFEN(this._impl.variant, arguments[0], arguments[1]);
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
 * Get the {@link GameVariant} in use.
 *
 * @returns {GameVariant}
 */
Position.prototype.variant = function() {
	return bt.variantToString(this._impl.variant);
};


/**
 * Get the content of a square.
 *
 * @param {Square} square
 * @returns {ColoredPiece|Empty}
 *
 *//**
 *
 * Set the content of a square.
 *
 * @param {Square} square
 * @param {ColoredPiece|Empty} value
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
 * Get the turn flag (i.e. who is about to play).
 *
 * @returns {Color}
 *
 *//**
 *
 * Set the turn flag (i.e. who is about to play).
 *
 * @param {Color} value
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
 * Get a castle flag (i.e. whether or not the corresponding castle is allowed or not).
 *
 * @param {Castle} castle
 * @returns {boolean}
 *
 *//**
 *
 * Set a castle flag (i.e. whether or not the corresponding castle is allowed or not).
 *
 * @param {Castle} castle
 * @param {boolean} value
 */
Position.prototype.castling = function(castle, value) { // TODO: make it chess-960 compatible.
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
 * Get the *en-passant* flag (i.e. the file on which *en-passant* is allowed, if any).
 *
 * @returns {EnPassantFlag}
 *
 *//**
 *
 * Set the *en-passant* flag (i.e. the file on which *en-passant* is allowed, if any).
 *
 * @param {EnPassantFlag} value
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
 * @param {Square} square
 * @param {Color} byWho
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
 * @param {Square} square
 * @param {Color} byWho
 * @returns {Square[]}
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
 *  2. The player that is not about to play is not in check.
 *  3. There are no pawn on ranks 1 and 8.
 *  4. For each colored castle flag set, there is a rook and a king on the
 *     corresponding initial squares.
 *  5. The pawn situation is consistent with the *en-passant* flag if it is set.
 *     For instance, if it is set to the "e" file and black is about to play,
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
 * @param {Color} color
 * @returns {Square|boolean} Square where is located the searched king. `false` is returned
 *          if there is no king of the given color, or if the are 2 such kings or more.
 */
Position.prototype.kingSquare = function(color) {
	color = bt.colorFromString(color);
	if(color < 0) {
		throw new exception.IllegalArgument('Position#kingSquare()');
	}
	legality.refreshLegalFlagAndKingSquares(this._impl);
	var square = this._impl.king[color];
	return square < 0 ? false : bt.squareToString(square);
};



// -----------------------------------------------------------------------------
// Move generation
// -----------------------------------------------------------------------------


/**
 * Return `true` if the player that is about to play is in check. If the position is not legal (see {@link Position#isLegal}),
 * the returned value is always `false`.
 *
 * @returns {boolean}
 */
Position.prototype.isCheck = function() {
	return moveGeneration.isCheck(this._impl);
};


/**
 * Return `true` if the player that is about to play is checkmated. If the position is not legal (see {@link Position#isLegal}),
 * the returned value is always `false`.
 *
 * @returns {boolean}
 */
Position.prototype.isCheckmate = function() {
	return moveGeneration.isCheckmate(this._impl);
};


/**
 * Return `true` if the player that is about to play is stalemated. If the position is not legal (see {@link Position#isLegal}),
 * the returned value is always `false`.
 *
 * @returns {boolean}
 */
Position.prototype.isStalemate = function() {
	return moveGeneration.isStalemate(this._impl);
};


/**
 * Whether at least one legal move exists in the current position or not. If the position is not legal (see {@link Position#isLegal}),
 * the returned value is always `false`.
 *
 * @returns {boolean}
 */
Position.prototype.hasMove = function() {
	return moveGeneration.hasMove(this._impl);
};


/**
 * Return the list of all legal moves in the current position. An empty list is returned if the position itself is not legal
 * (see {@link Position#isLegal}).
 *
 * @returns {MoveDescriptor[]}
 */
Position.prototype.moves = function() {
	return moveGeneration.moves(this._impl);
};


/**
 * Check whether a move is legal or not, and return the corresponding {@link MoveDescriptor} if it is legal.
 *
 * Depending on the situation, the method returns:
 *   - `false` if it is not possible to move from `from` to `to` (either because the move itself is not legal, or because the underlying
 *     position is not legal).
 *   - a {@link MoveDescriptor} object if the move is legal, and if it does not correspond to a promotion.
 *   - a `function` that takes in input a {@link Piece} (among `'q'`, `'r'`, `'b'` and `'n'`) and returns a {@link MoveDescriptor}
 *     if the move is legal and corresponds to a promotion. In this case, the {@link Piece} passed to this `function` corresponds
 *     to the promoted piece. Furthermore, the attribute `needPromotion` is set to `true` on the returned `function`.
 *
 * A code interpreting the result returned by {@link Position#isMoveLegal} would typically look like this:
 *
 * ```
 * var result = position.isMoveLegal(from, to);
 * if(!result) {
 *   // The move "from -> to" is not legal.
 * }
 * else if(result.needPromotion) {
 *   // The move "from -> to" is legal, but it corresponds to a promotion,
 *   // so the promoted piece must be specified. The corresponding move descriptors
 *   // are `result('q')`, `result('r')`, `result('b')` and `result('n')`.
 * }
 * else {
 *   // The move "from -> to" is legal, and the corresponding move descriptor is `result`.
 * }
 * ```
 *
 * @param {Square} from
 * @param {Square} to
 * @returns {boolean|MoveDescriptor|function(Piece):MoveDescriptor}
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
 * WARNING: when a {@link MoveDescriptor} is passed to this method, this {@link MoveDescriptor} must have been issued by one of the
 * {@link Position#moves} / {@link Position#isMoveLegal} / {@link Position#notation} methods of the current {@link Position}.
 * Trying to invoke {@link Position#play} with a {@link MoveDescriptor} generated by another {@link Position} object would result
 * in an undefined behavior.
 *
 * @param {string|MoveDescriptor} move
 * @returns {boolean} `true` if the move has been played, `false` if the move is not legal or if the string passed to the method
 *          cannot be interpreted as a valid SAN move notation (see {@link Position#notation}).
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
	else if(moveDescriptor.isMoveDescriptor(move)) {
		moveGeneration.play(this._impl, move);
		return true;
	}
	else {
		throw new exception.IllegalArgument('Position#play()');
	}
};


/**
 * Determine whether a null-move (i.e. switching the player about to play) can be play in the current position.
 *
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
 * Return the standard algebraic notation corresponding to the given move descriptor.
 *
 * @param {MoveDescriptor} moveDescriptor
 * @returns {string}
 *
 *//**
 *
 * Parse the given string as standard algebraic notation and return the corresponding move descriptor.
 *
 * @param {string} move
 * @param {boolean} [strict=false] If `true`, only perfectly formatted SAN moves are accepted. If `false`, "small errors" in the input
 *        such as a missing capture character, an unnecessary disambiguation symbol... do not interrupt the parsing.
 * @returns {MoveDescriptor}
 * @throws {module:exception.InvalidNotation} If the move parsing fails or if the parsed move would correspond to an illegal move.
 */
Position.prototype.notation = function() {
	if(arguments.length === 1 && moveDescriptor.isMoveDescriptor(arguments[0])) {
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
