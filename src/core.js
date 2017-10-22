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



// ---------------------------------------------------------------------------
// Internal constants and helper methods
// ---------------------------------------------------------------------------

// Colors
var WHITE = internals.WHITE;
var BLACK = internals.BLACK;

// Pieces
var KING   = internals.KING  ;
var QUEEN  = internals.QUEEN ;
var ROOK   = internals.ROOK  ;
var BISHOP = internals.BISHOP;
var KNIGHT = internals.KNIGHT;
var PAWN   = internals.PAWN  ;

// Special square values
var EMPTY = internals.EMPTY;
var INVALID = internals.INVALID;

// Colored pieces
var /* const */ WK = internals.WK; var /* const */ BK = internals.BK;
var /* const */ WQ = internals.WQ; var /* const */ BQ = internals.BQ;
var /* const */ WR = internals.WR; var /* const */ BR = internals.BR;
var /* const */ WB = internals.WB; var /* const */ BB = internals.BB;
var /* const */ WN = internals.WN; var /* const */ BN = internals.BN;
var /* const */ WP = internals.WP; var /* const */ BP = internals.BP;

// Whether the given colored piece is sliding or not.
function isSliding(coloredPiece) {
	return coloredPiece>=2 && coloredPiece<=7;
}

// Whether the given piece is admissible for promotion.
function isPromotablePiece(piece) {
	return piece>=1 && piece<=4;
}

// Attack directions per colored piece.
var /* const */ ATTACK_DIRECTIONS = [
	[-17, -16, -15, -1, 1, 15, 16, 17], // king/queen
	[-17, -16, -15, -1, 1, 15, 16, 17], // king/queen
	[-17, -16, -15, -1, 1, 15, 16, 17], // king/queen
	[-17, -16, -15, -1, 1, 15, 16, 17], // king/queen
	[-16, -1, 1, 16], // rook
	[-16, -1, 1, 16], // rook
	[-17, -15, 15, 17], // bishop
	[-17, -15, 15, 17], // bishop
	[-33, -31, -18, -14, 14, 18, 31, 33], // knight
	[-33, -31, -18, -14, 14, 18, 31, 33], // knight
	[15, 17], // white pawn
	[-17, -15] // black pawn
];

// Displacement lookup per square index difference.
var /* const */ DISPLACEMENT_LOOKUP = [
 204,    0,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,    0,  204,    0,
	 0,  204,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,  204,    0,    0,
	 0,    0,  204,    0,    0,    0,    0,   60,    0,    0,    0,    0,  204,    0,    0,    0,
	 0,    0,    0,  204,    0,    0,    0,   60,    0,    0,    0,  204,    0,    0,    0,    0,
	 0,    0,    0,    0,  204,    0,    0,   60,    0,    0,  204,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  204,  768,   60,  768,  204,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  768, 2255, 2111, 2255,  768,    0,    0,    0,    0,    0,    0,
	60,   60,   60,   60,   60,   60,   63,    0,   63,   60,   60,   60,   60,   60,   60,    0,
	 0,    0,    0,    0,    0,  768, 1231, 1087, 1231,  768,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  204,  768,   60,  768,  204,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,  204,    0,    0,   60,    0,    0,  204,    0,    0,    0,    0,    0,
	 0,    0,    0,  204,    0,    0,    0,   60,    0,    0,    0,  204,    0,    0,    0,    0,
	 0,    0,  204,    0,    0,    0,    0,   60,    0,    0,    0,    0,  204,    0,    0,    0,
	 0,  204,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,  204,    0,    0,
 204,    0,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,    0,  204,    0
];

// Sliding direction
var /* const */ SLIDING_DIRECTION = [
	-17,   0,   0,   0,   0,   0,   0, -16,   0,   0,   0,   0,   0,   0, -15,   0,
		0, -17,   0,   0,   0,   0,   0, -16,   0,   0,   0,   0,   0, -15,   0,   0,
		0,   0, -17,   0,   0,   0,   0, -16,   0,   0,   0,   0, -15,   0,   0,   0,
		0,   0,   0, -17,   0,   0,   0, -16,   0,   0,   0, -15,   0,   0,   0,   0,
		0,   0,   0,   0, -17,   0,   0, -16,   0,   0, -15,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0, -17,   0, -16,   0, -15,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0,   0, -17, -16, -15,   0,   0,   0,   0,   0,   0,   0,
	 -1,  -1,  -1,  -1,  -1,  -1,  -1,   0,   1,   1,   1,   1,   1,   1,   1,   0,
		0,   0,   0,   0,   0,   0,  15,  16,  17,   0,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0,  15,   0,  16,   0,  17,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,  15,   0,   0,  16,   0,   0,  17,   0,   0,   0,   0,   0,
		0,   0,   0,  15,   0,   0,   0,  16,   0,   0,   0,  17,   0,   0,   0,   0,
		0,   0,  15,   0,   0,   0,   0,  16,   0,   0,   0,   0,  17,   0,   0,   0,
		0,  15,   0,   0,   0,   0,   0,  16,   0,   0,   0,   0,   0,  17,   0,   0,
	 15,   0,   0,   0,   0,   0,   0,  16,   0,   0,   0,   0,   0,   0,  17,   0
];


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
// Getters/setters
// ---------------------------------------------------------------------------

require('./core/position/access');


// ---------------------------------------------------------------------------
// Square control & position legality
// ---------------------------------------------------------------------------

/**
 * Check if any piece of the given color attacks a given square.
 *
 * @param {string} square
 * @param {string} byWho Either `'w'` or `'b'`
 * @param {string} [byWhat] Filter for the type of attacker (for instance, `'kp'` to consider only king and pawn attacks).
 *        If `null` or not defined, no filter is applied, and all types of pieces are considered.
 * @returns {boolean}
 */
Position.prototype.isAttacked = function(square, byWho, byWhat) {
	square = parseSquare(square);
	byWho  = parseColor (byWho );
	if(square < 0 || byWho < 0) {
		throw new exception.IllegalArgument('Position#isAttacked()');
	}
	if(typeof byWhat === 'undefined' || byWhat === null) {
		return isAttacked(this, square, byWho);
	}
	else if(typeof byWhat === 'string') {
		for(var piece=0; piece<PIECE_SYMBOL.length; ++piece) {
			if(byWhat.indexOf(PIECE_SYMBOL[piece])>=0 && isAttackedBy(this, square, piece*2 + byWho)) {
				return true;
			}
		}
		return false;
	}
	else {
		throw new exception.IllegalArgument('Position#isAttacked()');
	}
};


/**
 * Check if a given type of piece attacks a given square.
 *
 * This method can be used even if the position is not legal.
 *
 * @param {Position} position
 * @param {number} square Square index.
 * @param {number} attacker Colored piece constant.
 * @returns {boolean}
 */
function isAttackedBy(position, square, attacker) {
	var directions = ATTACK_DIRECTIONS[attacker];
	if(isSliding(attacker)) {
		for(var i=0; i<directions.length; ++i) {
			var sq = square;
			while(true) {
				sq -= directions[i];
				if((sq /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var cp = position._board[sq];
					if(cp === attacker) { return true; }
					else if(cp === EMPTY) { continue; }
				}
				break;
			}
		}
	}
	else {
		for(var i=0; i<directions.length; ++i) {
			var sq = square - directions[i];
			if((sq /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0 && position._board[sq]===attacker) {
				return true;
			}
		}
	}
	return false;
}


/**
 * Check if any piece of the given color attacks a given square.
 *
 * This method can be used even if the position is not legal.
 *
 * @param {Position} position
 * @param {number} square Square index.
 * @param {number} attackerColor Color constant.
 * @returns {boolean}
 */
function isAttacked(position, square, attackerColor) {
	for(var piece=0; piece<6; ++piece) {
		if(isAttackedBy(position, square, piece*2 + attackerColor)) {
			return true;
		}
	}
	return false;
}


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
	refreshLegalFlag(this);
	return this._legal;
};


/**
 * Return the square on which is located the king of the given color.
 *
 * @param {string} color
 * @returns {string} Square where is located the searched king. `'-'` is returned
 *          if there is no king of the given color or if the are 2 such kings or more.
 */
Position.prototype.kingSquare = function(color) {
	color = parseColor(color);
	if(color < 0) {
		throw new exception.IllegalArgument('Position#kingSquare()');
	}
	refreshLegalFlag(this);
	var square = this._king[color];
	return square < 0 ? '-' : squareToString(square);
};


/**
 * Refresh the legal flag of the current position if it is set to null
 * (which means that the legality state of the position is unknown).
 *
 * Together with the legal flag, the reference to the squares where the white and
 * black kings lie is updated by this function.
 *
 * TODO: make it chess-960 compatible.
 *
 * @param {Position} position
 */
function refreshLegalFlag(position) {
	if(position._legal !== null) {
		return;
	}
	position._legal = false;

	// Condition (1)
	refreshKingSquare(position, WHITE);
	refreshKingSquare(position, BLACK);
	if(position._king[WHITE] < 0 || position._king[BLACK] < 0) {
		return;
	}

	// Condition (2)
	if(isAttacked(position, position._king[1-position._turn], position._turn)) {
		return;
	}

	// Condition (3)
	for(var c=0; c<8; ++c) {
		var cp1 = position._board[c];
		var cp8 = position._board[112 + c];
		if(cp1 === WP || cp8 === WP || cp1 === BP || cp8 === BP) {
			return;
		}
	}

	// Condition (4)
	for(var color=0; color<2; ++color) {
		var skipOO  = !getCastleRights(position, color, 7);
		var skipOOO = !getCastleRights(position, color, 0);
		var rookHOK = skipOO              || position._board[7 + 112*color] === ROOK*2 + color;
		var rookAOK = skipOOO             || position._board[0 + 112*color] === ROOK*2 + color;
		var kingOK  = (skipOO && skipOOO) || position._board[4 + 112*color] === KING*2 + color;
		if(!(kingOK && rookAOK && rookHOK)) {
			return;
		}
	}

	// Condition (5)
	if(position._enPassant >= 0) {
		var square2 = (6-position._turn*5)*16 + position._enPassant;
		var square3 = (5-position._turn*3)*16 + position._enPassant;
		var square4 = (4-position._turn  )*16 + position._enPassant;
		if(!(position._board[square2]===EMPTY && position._board[square3]===EMPTY && position._board[square4]===PAWN*2+1-position._turn)) {
			return;
		}
	}

	// At this point, all the conditions (1) to (5) hold, so the position can be flagged as legal.
	position._legal = true;
}


/**
 * Detect the kings of the given color that are present on the chess board.
 *
 * @param {Position} position
 * @param {number} color
 */
function refreshKingSquare(position, color) {
	var target = KING*2 + color;
	position._king[color] = -1;
	for(var sq=0; sq<120; sq += (sq /* jshint bitwise:false */ & 0x7 /* jshint bitwise:true */)===7 ? 9 : 1) {
		if(position._board[sq] === target) {

			// If the targeted king is detected on the square sq, two situations may occur:
			// 1) No king was detected on the previously visited squares: then the current
			//    square is saved, and loop over the next board squares goes on.
			if(position._king[color] < 0) {
				position._king[color] = sq;
			}

			// 2) Another king was detected on the previously visited squares: then the buffer position._king[color]
			//    is set to the invalid state (-1), and the loop is interrupted.
			else {
				position._king[color] = -1;
				return;
			}
		}
	}
}



// ---------------------------------------------------------------------------
// Move descriptor
// ---------------------------------------------------------------------------

/**
 * Type of move.
 *
 * @const
 */
var movetype = {
	NORMAL_MOVE         : 0,
	CASTLING_MOVE       : 1,
	EN_PASSANT_CAPTURE  : 2,
	TWO_SQUARE_PAWN_MOVE: 3,
	PROMOTION           : 4
};


/**
 * @constructor
 * @alias MoveDescriptor
 * @memberof RPBChess
 *
 * @classdesc
 * Hold the raw information that is required to play a move in a given position.
 *
 * DO NOT INSTANTIATE AN OBJECT OF THIS CLASS DIRECTLY FROM CLIENT APPLICATIONS.
 */
function MoveDescriptor() {
	if(arguments[0] instanceof MoveDescriptor) { // Promotion -> MoveDescriptor(descriptor, promotion)
		this._type        = movetype.PROMOTION;
		this._movingPiece = arguments[0]._movingPiece;
		this._movingColor = arguments[0]._movingColor;
		this._isCapture   = arguments[0]._isCapture  ;
		this._from        = arguments[0]._from       ;
		this._to          = arguments[0]._to         ;
		this._promotion   = arguments[1];
	}
	else {
		this._type        = arguments[0];
		this._movingPiece = arguments[1];
		this._movingColor = arguments[2];
		this._isCapture   = arguments[3];
		this._from        = arguments[4];
		this._to          = arguments[5];

		switch(this._type) {

			// Castling move -> MoveDescriptor(CASTLING_MOVE, movingPiece, movingColor, isCapture, from, to, rookFrom, rookTo)
			case movetype.CASTLING_MOVE:
				this._rookFrom = arguments[6];
				this._rookTo   = arguments[7];
				break;

			// En-passant capture -> MoveDescriptor(EN_PASSANT_CAPTURE, movingPiece, movingColor, isCapture, from, to, enPassantSquare)
			case movetype.EN_PASSANT_CAPTURE:
				this._enPassantSquare = arguments[6];
				break;

			// Two-square pawn move -> MoveDescriptor(TWO_SQUARE_PAWN_MOVE, movingPiece, movingColor, isCapture, from, to, twoSquarePawnMoveColumn)
			case movetype.TWO_SQUARE_PAWN_MOVE:
				this._twoSquarePawnMoveColumn = arguments[6];
				break;

			// Normal move -> MoveDescriptor(NORMAL_MOVE, movingPiece, movingColor, isCapture, from, to)
			default:
				break;
		}
	}
}


/**
 * Type of move.
 *
 * @returns {number} One of the constant defined by {@link movetype}.
 */
MoveDescriptor.prototype.type = function() {
	return this._type;
};


/**
 * Moving piece (king in case of a castling move).
 *
 * @returns {string}
 */
MoveDescriptor.prototype.movingPiece = function() {
	return PIECE_SYMBOL[this._movingPiece];
};


/**
 * Moving color.
 *
 * @returns {string} Either `'w'` or `'b'`
 */
MoveDescriptor.prototype.movingColor = function() {
	return COLOR_SYMBOL[this._movingColor];
};


/**
 * Whether the move captures something or not. Returns `true` for en-passant move too.
 *
 * @returns {boolean}
 */
MoveDescriptor.prototype.isCapture = function() {
	return this._isCapture;
};


/**
 * Start square of the move.
 *
 * @returns {string}
 */
MoveDescriptor.prototype.from = function() {
	return squareToString(this._from);
};


/**
 * Destination square of the move.
 *
 * @returns {string}
 */
MoveDescriptor.prototype.to = function() {
	return squareToString(this._to);
};


/**
 * Start square of the rook in case of a castling move.
 *
 * @returns {string} `'-'` if not a castling move.
 */
MoveDescriptor.prototype.rookFrom = function() {
	return this._type===movetype.CASTLING_MOVE ? squareToString(this._rookFrom) : '-';
};


/**
 * Destination square of the rook in case of a castling move.
 *
 * @returns {string} `'-'` if not a castling move.
 */
MoveDescriptor.prototype.rookTo = function() {
	return this._type===movetype.CASTLING_MOVE ? squareToString(this._rookTo) : '-';
};


/**
 * Square where the taken pawn lies in case of a "en-passant" move.
 *
 * @returns {string} `'-'` if not a "en-passant" move.
 */
MoveDescriptor.prototype.enPassantSquare = function() {
	return this._type===movetype.EN_PASSANT_CAPTURE ? squareToString(this._enPassantSquare) : '-';
};


/**
 * Column on which the pawn moves in case of a two-square pawn move.
 *
 * @returns {string} `'-'` if not a two-square pawn move.
 */
MoveDescriptor.prototype.twoSquarePawnMoveColumn = function() {
	return this._type===movetype.TWO_SQUARE_PAWN_MOVE ? COLUMN_SYMBOL[this._twoSquarePawnMoveColumn] : '-';
};


/**
 * Promoted piece in case of a promotion move.
 *
 * @returns {string} `'-'` if not a promotion move.
 */
MoveDescriptor.prototype.promotion = function() {
	return this._type===movetype.PROMOTION ? PIECE_SYMBOL[this._promotion] : '-';
};



// ---------------------------------------------------------------------------
// Move generation & check/checkmate/stalemate tests
// ---------------------------------------------------------------------------

/**
 * Return true if the player that is about to play is in check. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isCheck = function() {
	return this.isLegal() && isAttacked(this, this._king[this._turn], 1-this._turn);
};


/**
 * Return true if the player that is about to play is checkmated. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isCheckmate = function() {
	return this.isLegal() && !this.hasMove() && isAttacked(this, this._king[this._turn], 1-this._turn);
};


/**
 * Return true if the player that is about to play is stalemated. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.isStalemate = function() {
	return this.isLegal() && !this.hasMove() && !isAttacked(this, this._king[this._turn], 1-this._turn);
};


/**
 * Whether a move is legal or not.
 *
 * @param {string|{from:string, to:string}|{from:string, to:string, promotion:string}} move
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
Position.prototype.isMoveLegal = function(move) {

	// Notation parsing
	if(typeof move === 'string') {
		try {
			return parseNotation(this, move, false);
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

	// Move object
	else if(typeof move === 'object' && move !== null && typeof move.from === 'string' && typeof move.to === 'string') {
		var from = parseSquare(move.from);
		var to   = parseSquare(move.to  );
		if(from>=0 && to>=0) {
			if(typeof move.promotion === 'string') {
				var promotion = PIECE_SYMBOL.indexOf(move.promotion);
				if(promotion>=0) {
					return isMoveLegal(this, from, to, promotion);
				}
			}
			else {
				return isMoveLegal(this, from, to, -1);
			}
		}
	}

	// Unknown move format
	throw new exception.IllegalArgument('Position#isMoveLegal()');
};


/**
 * Detect if there exist any legal move in the current position. If the position is not legal, the returned value is always false.
 *
 * @returns {boolean}
 */
Position.prototype.hasMove = function() {
	function MoveFound() {}
	try {
		generateMoves(this, function(descriptor) {
			if(descriptor) { throw new MoveFound(); }
		});
		return false;
	}
	catch(err) {
		if(err instanceof MoveFound) { return true; }
		else { throw err; }
	}
};


/**
 * Return the list of all legal moves in the current position. An empty list is returned if the position itself is not legal.
 *
 * @returns {MoveDescriptor[]}
 */
Position.prototype.moves = function() {
	var res = [];
	generateMoves(this, function(descriptor, generatePromotions) {
		if(descriptor) {
			if(generatePromotions) {
				res.push(new MoveDescriptor(descriptor, QUEEN ));
				res.push(new MoveDescriptor(descriptor, ROOK  ));
				res.push(new MoveDescriptor(descriptor, BISHOP));
				res.push(new MoveDescriptor(descriptor, KNIGHT));
			}
			else {
				res.push(descriptor);
			}
		}
	});
	return res;
};


/**
 * Generate all the legal moves of the given position.
 *
 * @param {Position} position
 * @param {boolean} fun Function called when a legal move is found.
 */
function generateMoves(position, fun) {

	// Ensure that the position is legal.
	if(!position.isLegal()) { return; }

	// For all potential 'from' square...
	for(var from=0; from<120; from += (from /* jshint bitwise:false */ & 0x7 /* jshint bitwise:true */)===7 ? 9 : 1) {

		// Nothing to do if the current square does not contain a piece of the right color.
		var fromContent = position._board[from];
		var movingPiece = Math.floor(fromContent / 2);
		if(fromContent < 0 || fromContent%2 !== position._turn) {
			continue;
		}

		// Generate moves for pawns
		if(movingPiece === PAWN) {

			// Capturing moves
			var attackDirections = ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<attackDirections.length; ++i) {
				var to = from + attackDirections[i];
				if((to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var toContent = position._board[to];
					if(toContent >= 0 && toContent%2 !== position._turn) { // regular capturing move
						fun(isKingSafeAfterMove(position, from, to, -1, -1), to<8 || to>=112);
					}
					else if(toContent < 0 && to === (5-position._turn*3)*16 + position._enPassant) { // en-passant move
						fun(isKingSafeAfterMove(position, from, to, (4-position._turn)*16 + position._enPassant, -1), false);
					}
				}
			}

			// Non-capturing moves
			var moveDirection = 16 - position._turn*32;
			var to = from + moveDirection;
			if(position._board[to] < 0) {
				fun(isKingSafeAfterMove(position, from, to, -1, -1), to<8 || to>=112);

				// 2-square pawn move
				var firstSquareOfRow = (1 + position._turn*5) * 16;
				if(from>=firstSquareOfRow && from<firstSquareOfRow+8) {
					to += moveDirection;
					if(position._board[to] < 0) {
						fun(isKingSafeAfterMove(position, from, to, -1, from % 8), false);
					}
				}
			}
		}

		// Generate moves for sliding pieces
		else if(isSliding(fromContent)) {
			var directions = ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				for(var to=from+directions[i]; (to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0; to+=directions[i]) {
					var toContent = position._board[to];
					if(toContent < 0 || toContent%2 !== position._turn) {
						fun(isKingSafeAfterMove(position, from, to, -1, -1), false);
					}
					if(toContent >= 0) { break; }
				}
			}
		}

		// Generate moves for non-sliding non-pawn pieces
		else {
			var directions = ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				var to = from + directions[i];
				if((to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var toContent = position._board[to];
					if(toContent < 0 || toContent%2 !== position._turn) {
						fun(isKingSafeAfterMove(position, from, to, -1, -1), false);
					}
				}
			}
		}

		// Generate castling moves
		if(movingPiece === KING && position._castleRights[position._turn] !== 0) {
			var to = [from-2, from+2];
			for(var i=0; i<to.length; ++i) {
				fun(isCastlingLegal(position, from, to[i]), false);
			}
		}
	}
}


/**
 * Core algorithm to determine whether a move is legal or not. The verification flow is the following:
 *
 *  1. Ensure that the position itself is legal.
 *  2. Ensure that the origin square contains a piece (denoted as the moving-piece)
 *     whose color is the same than the color of the player about to play.
 *  3. Check the promotion field.
 *  4. Ensure that the displacement is geometrically correct, with respect to the moving piece.
 *  5. Check the content of the destination square.
 *  6. For the sliding pieces (and in case of a 2-square pawn move), ensure that there is no piece
 *     on the trajectory.
 *
 * The move is almost ensured to be legal at this point. The last condition to check
 * is whether the king of the current player will be in check after the move or not.
 *
 *  7. Execute the displacement from the origin to the destination square, in such a way that
 *     it can be reversed. Only the state of the board is updated at this point.
 *  8. Look for king attacks.
 *  9. Reverse the displacement.
 *
 * Castling moves fail at step (4). They are taken out of this flow and processed
 * by the dedicated method `isLegalCastling()`.
 *
 * @param {Position} position
 * @param {number} from Index of the origin square.
 * @param {number} to Index of the destination square.
 * @param {number} promotion Code of the promoted piece if any, `-1` otherwise.
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
function isMoveLegal(position, from, to, promotion) {

	// Step (1)
	if(!position.isLegal()) { return false; }

	// Step (2)
	var fromContent = position._board[from];
	var toContent   = position._board[to  ];
	var movingPiece = Math.floor(fromContent / 2);
	if(fromContent < 0 || fromContent%2 !== position._turn) { return false; }

	// Step (3)
	if(movingPiece===PAWN && (to<8 || to>=112)) {
		if(!isPromotablePiece(promotion)) { return false; }
	}
	else {
		if(promotion>=0) { return false; }
	}

	// Miscellaneous variables
	var displacement = to - from + 119;
	var enPassantSquare         = -1; // square where a pawn is taken if the move is "en-passant"
	var twoSquarePawnMoveColumn = -1; // column where the pawn moves in case of a two-square pawn move

	// Step (4)
	if((DISPLACEMENT_LOOKUP[displacement] /* jshint bitwise:false */ & 1<<fromContent /* jshint bitwise:true */) === 0) {
		if(movingPiece === PAWN && displacement === 151-position._turn*64) {
			var firstSquareOfRow = (1 + position._turn*5) * 16;
			if(from < firstSquareOfRow || from >= firstSquareOfRow+8) { return false; }
			twoSquarePawnMoveColumn = from % 8;
		}
		else if(movingPiece === KING && (displacement === 117 || displacement === 121)) {
			return isCastlingLegal(position, from, to);
		}
		else {
			return false;
		}
	}

	// Step (5) -> check the content of the destination square
	if(movingPiece === PAWN) {
		if(displacement === 135-position._turn*32 || twoSquarePawnMoveColumn >= 0) { // non-capturing pawn move
			if(toContent !== EMPTY) { return false; }
		}
		else if(toContent === EMPTY) { // en-passant pawn move
			if(position._enPassant < 0 || to !== (5-position._turn*3)*16 + position._enPassant) { return false; }
			enPassantSquare = (4-position._turn)*16 + position._enPassant;
		}
		else { // regular capturing pawn move
			if(toContent%2 === position._turn) { return false; }
		}
	}
	else { // piece move
		if(toContent >= 0 && toContent%2 === position._turn) { return false; }
	}

	// Step (6) -> For sliding pieces, ensure that there is nothing between the origin and the destination squares.
	if(isSliding(fromContent)) {
		var direction = SLIDING_DIRECTION[displacement];
		for(var sq=from + direction; sq !== to; sq += direction) {
			if(position._board[sq] !== EMPTY) { return false; }
		}
	}
	else if(twoSquarePawnMoveColumn >= 0) { // two-square pawn moves also require this test.
		if(position._board[(from + to) / 2] !== EMPTY) { return false; }
	}

	// Steps (7) to (9) are delegated to `isKingSafeAfterMove`.
	var descriptor = isKingSafeAfterMove(position, from, to, enPassantSquare, twoSquarePawnMoveColumn);
	return descriptor && promotion>=0 ? new MoveDescriptor(descriptor, promotion) : descriptor;
}


/**
 * Check whether the current player king is in check after moving from `from` to `to`.
 *
 * This function implements the verification steps (7) to (9) as defined in {@link #isMoveLegal}
 *
 * @param {Position} position
 * @param {number} from
 * @param {number} to
 * @param {number} enPassantSquare Index of the square where the "en-passant" taken pawn lies if any, `-1` otherwise.
 * @param {number} twoSquarePawnMoveColumn Column where the displacement occurs in case of a two-square pawn move, `-1` otherwise.
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
function isKingSafeAfterMove(position, from, to, enPassantSquare, twoSquarePawnMoveColumn) {
	var fromContent = position._board[from];
	var toContent   = position._board[to  ];
	var movingPiece = Math.floor(fromContent / 2);

	// Step (7) -> Execute the displacement (castling moves are processed separately).
	position._board[to  ] = fromContent;
	position._board[from] = EMPTY;
	if(enPassantSquare >= 0) {
		position._board[enPassantSquare] = EMPTY;
	}

	// Step (8) -> Is the king safe after the displacement?
	var kingSquare    = movingPiece===KING ? to : position._king[position._turn];
	var kingIsInCheck = isAttacked(position, kingSquare, 1-position._turn);

	// Step (9) -> Reverse the displacement.
	position._board[from] = fromContent;
	position._board[to  ] = toContent;
	if(enPassantSquare >= 0) {
		position._board[enPassantSquare] = PAWN*2 + 1-position._turn;
	}

	// Final result
	if(kingIsInCheck) {
		return false;
	}
	else {
		if(enPassantSquare >= 0) {
			return new MoveDescriptor(movetype.EN_PASSANT_CAPTURE, movingPiece, position._turn, true, from, to, enPassantSquare);
		}
		else if(twoSquarePawnMoveColumn >= 0) {
			return new MoveDescriptor(movetype.TWO_SQUARE_PAWN_MOVE, movingPiece, position._turn, false, from, to, twoSquarePawnMoveColumn);
		}
		else {
			return new MoveDescriptor(movetype.NORMAL_MOVE, movingPiece, position._turn, toContent>=0, from, to);
		}
	}
}


/**
 * Delegated method for checking whether a castling move is legal or not.
 *
 * TODO: make it chess-960 compatible.
 *
 * @param {Position} position
 * @param {number} from
 * @param {number} to
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
function isCastlingLegal(position, from, to) {

	// Ensure that the given underlying castling is allowed.
	var column = from < to ? 7 : 0;
	if((position._castleRights[position._turn] /* jshint bitwise:false */ & 1<<column /* jshint bitwise:true */) === 0) {
		return false;
	}

	// Origin and destination squares of the rook involved in the move.
	var rookFrom = column + position._turn*112;
	var rookTo   = (from + to) / 2;

	// Ensure that each square between the king and the rook is empty.
	var offset = from < rookFrom ? 1 : -1;
	for(var sq=from+offset; sq!==rookFrom; sq+=offset) {
		if(position._board[sq] !== EMPTY) { return false; }
	}

	// The origin and destination squares of the king, and the square between them must not be attacked.
	var byWho = 1-position._turn;
	if(isAttacked(position, from, byWho) || isAttacked(position, to, byWho) || isAttacked(position, rookTo, byWho)) {
		return false;
	}

	// The move is legal -> generate the move descriptor.
	return new MoveDescriptor(movetype.CASTLING_MOVE, KING, position._turn, false, from, to, rookFrom, rookTo);
}


/**
 * Play the given move if it is legal.
 *
 * @param {string} move
 * @returns {boolean} `true` if the move has been played and if it is legal, `false` otherwise.
 */
Position.prototype.play = function(move) {
	var descriptor = (move instanceof MoveDescriptor) ? move : this.isMoveLegal(move);
	if(descriptor) {

		// Update the board
		var cp = descriptor._type===movetype.PROMOTION ? (descriptor._promotion*2 + this._turn) : this._board[descriptor._from];
		this._board[descriptor._from] = EMPTY;
		if(descriptor._type===movetype.EN_PASSANT_CAPTURE) {
			this._board[descriptor._enPassantSquare] = EMPTY;
		}
		else if(descriptor._type===movetype.CASTLING_MOVE) {
			this._board[descriptor._rookFrom] = EMPTY;
			this._board[descriptor._rookTo  ] = ROOK*2 + this._turn;
		}
		this._board[descriptor._to] = cp;

		// Update the castling flags
		if(descriptor._movingPiece === KING) {
			this._castleRights[this._turn] = 0;
		}
		if(descriptor._from <    8) { this._castleRights[WHITE] /* jshint bitwise:false */ &= ~(1 <<  descriptor._from    ); /* jshint bitwise:true */ }
		if(descriptor._to   <    8) { this._castleRights[WHITE] /* jshint bitwise:false */ &= ~(1 <<  descriptor._to      ); /* jshint bitwise:true */ }
		if(descriptor._from >= 112) { this._castleRights[BLACK] /* jshint bitwise:false */ &= ~(1 << (descriptor._from%16)); /* jshint bitwise:true */ }
		if(descriptor._to   >= 112) { this._castleRights[BLACK] /* jshint bitwise:false */ &= ~(1 << (descriptor._to  %16)); /* jshint bitwise:true */ }

		// Update the other flags
		this._enPassant = descriptor._type===movetype.TWO_SQUARE_PAWN_MOVE ? descriptor._twoSquarePawnMoveColumn : -1;
		if(descriptor._movingPiece === KING) {
			this._king[this._turn] = descriptor._to;
		}

		// Toggle the turn flag
		this._turn = 1-this._turn;

		// Final result
		return true;
	}
	else {
		return false;
	}
};


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
// Notation
// ---------------------------------------------------------------------------

/**
 * `notation(moveDescriptor)`: return the standard algebraic notation corresponding to the given move descriptor.
 *
 * `notation(string [, boolean])`: parse the given string as standard algebraic notation and return the corresponding move descriptor.
 *
 * @throws {InvalidNotation} If the move parsing fails or if the parsed move would correspond to an illegal move.
 */
Position.prototype.notation = function() {
	if(arguments.length === 1 && arguments[0] instanceof MoveDescriptor) {
		return getNotation(this, arguments[0]);
	}
	else if(arguments.length === 1 && typeof arguments[0] === 'string') {
		return parseNotation(this, arguments[0], false);
	}
	else if(arguments.length >= 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'boolean') {
		return parseNotation(this, arguments[0], arguments[1]);
	}
	else {
		throw new exception.IllegalArgument('Position#notation()');
	}
};


/**
 * Convert the given move descriptor to standard algebraic notation.
 *
 * @param {Position} position
 * @param {MoveDescriptor} descriptor
 * @returns {string}
 */
function getNotation(position, descriptor) {
	var res = '';

	// Castling moves
	if(descriptor._type === movetype.CASTLING_MOVE) {
		res = descriptor._from < descriptor._to ? 'O-O' : 'O-O-O';
	}

	// Pawn moves
	else if(descriptor._movingPiece === PAWN) {
		if(descriptor._isCapture) {
			res += COLUMN_SYMBOL[descriptor._from % 16] + 'x';
		}
		res += squareToString(descriptor._to);
		if(descriptor._type === movetype.PROMOTION) {
			res += '=' + PIECE_SYMBOL[descriptor._promotion].toUpperCase();
		}
	}

	// Non-pawn move
	else {
		res += PIECE_SYMBOL[descriptor._movingPiece].toUpperCase();
		res += getDisambiguationSymbol(position, descriptor._from, descriptor._to);
		if(descriptor._isCapture) {
			res += 'x';
		}
		res += squareToString(descriptor._to);
	}

	// Check/checkmate detection and final result.
	res += getCheckCheckmateSymbol(position, descriptor);
	return res;
}


/**
 * Return the check/checkmate symbol to use for a move.
 *
 * @param {Position} position
 * @param {MoveDescriptor} descriptor
 * @returns {string}
 */
function getCheckCheckmateSymbol(position, descriptor) {
	var position2 = new Position(position);
	position2.play(descriptor);
	return position2.isCheck() ? (position2.hasMove() ? '+' : '#') : '';
}


/**
 * Return the disambiguation symbol to use for a move from `from` to `to`.
 *
 * @param {Position} position
 * @param {number} from
 * @param {number} to
 * @returns {string}
 */
function getDisambiguationSymbol(position, from, to) {
	var attackers = getAttackers(position, to, position._board[from]);

	// Disambiguation is necessary if there is more than 1 attacker.
	if(attackers.length >= 2) {
		var foundNotPined     = false;
		var foundOnSameRow    = false;
		var foundOnSameColumn = false;
		var rowFrom    = Math.floor(from / 16);
		var columnFrom = from % 16;
		for(var i=0; i<attackers.length; ++i) {
			var sq = attackers[i];
			if(sq === from) { continue; }
			if(isKingSafeAfterMove(position, sq, to, -1, -1)) {
				foundNotPined = true;
				if(rowFrom === Math.floor(sq / 16)) { foundOnSameRow = true; }
				if(columnFrom === sq % 16) { foundOnSameColumn = true; }
			}
		}
		if(foundOnSameColumn) {
			return foundOnSameRow ? squareToString(from) : ROW_SYMBOL[rowFrom];
		}
		else {
			return foundNotPined ? COLUMN_SYMBOL[columnFrom] : '';
		}
	}

	// Disambiguation is not necessary!
	else {
		return '';
	}
}


/**
 * Return the squares from which a given type of piece attacks a given square.
 *
 * This method can be used even if the position is not legal.
 *
 * @param {Position} position
 * @param {number} square Square index.
 * @param {number} attacker Colored piece constant.
 * @returns {number[]}
 */
function getAttackers(position, square, attacker) {
	var res = [];
	var directions = ATTACK_DIRECTIONS[attacker];
	if(isSliding(attacker)) {
		for(var i=0; i<directions.length; ++i) {
			var sq = square;
			while(true) {
				sq -= directions[i];
				if((sq /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var cp = position._board[sq];
					if(cp === attacker) { res.push(sq); }
					else if(cp === EMPTY) { continue; }
				}
				break;
			}
		}
	}
	else {
		for(var i=0; i<directions.length; ++i) {
			var sq = square - directions[i];
			if((sq /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0 && position._board[sq]===attacker) {
				res.push(sq);
			}
		}
	}
	return res;
}


/**
 * Parse a move notation for the given position.
 *
 * @param {Position} position
 * @param {string} notation
 * @param {boolean} strict
 * @returns {MoveDescriptor}
 * @throws InvalidNotation
 */
function parseNotation(position, notation, strict) {

	// General syntax
	var m = /^(?:(O-O-O)|(O-O)|([KQRBN])([a-h])?([1-8])?(x)?([a-h][1-8])|(?:([a-h])(x)?)?([a-h][1-8])(?:(=)?([KQRBNP]))?)([\+#])?$/.exec(notation);
	if(m === null) {
		throw new exception.InvalidNotation(position, notation, i18n.INVALID_MOVE_NOTATION_SYNTAX);
	}

	// Ensure that the position is legal.
	if(!position.isLegal()) {
		throw new exception.InvalidNotation(position, notation, i18n.ILLEGAL_POSITION);
	}

	// CASTLING
	// m[1] -> O-O-O
	// m[2] -> O-O

	// NON-PAWN MOVE
	// m[3] -> moving piece
	// m[4] -> column disambiguation
	// m[5] -> row disambiguation
	// m[6] -> x (capture symbol)
	// m[7] -> to

	// PAWN MOVE
	// m[ 8] -> from column (only for captures)
	// m[ 9] -> x (capture symbol)
	// m[10] -> to
	// m[11] -> = (promotion symbol)
	// m[12] -> promoted piece

	// OTHER
	// m[13] -> +/# (check/checkmate symbols)

	var descriptor = null;

	// Parse castling moves
	if(m[1] || m[2]) {
		var from = position._king[position._turn];
		var to   = from + (m[2] ? 2 : -2);
		descriptor = isCastlingLegal(position, from, to);
		if(!descriptor) {
			var message = m[2] ? i18n.ILLEGAL_KING_SIDE_CASTLING : i18n.ILLEGAL_QUEEN_SIDE_CASTLING;
			throw new exception.InvalidNotation(position, notation, message);
		}
	}

	// Non-pawn move
	else if(m[3]) {
		var movingPiece = PIECE_SYMBOL.indexOf(m[3].toLowerCase());
		var to = parseSquare(m[7]);
		var toContent = position._board[to];

		// Cannot take your own pieces!
		if(toContent >= 0 && toContent % 2 === position._turn) {
			throw new exception.InvalidNotation(position, notation, i18n.TRYING_TO_CAPTURE_YOUR_OWN_PIECES);
		}

		// Find the "from"-square candidates
		var attackers = getAttackers(position, to, movingPiece*2 + position._turn);

		// Apply disambiguation
		if(m[4]) {
			var columnFrom = COLUMN_SYMBOL.indexOf(m[4]);
			attackers = attackers.filter(function(sq) { return sq%16 === columnFrom; });
		}
		if(m[5]) {
			var rowFrom = ROW_SYMBOL.indexOf(m[5]);
			attackers = attackers.filter(function(sq) { return Math.floor(sq/16) === rowFrom; });
		}
		if(attackers.length===0) {
			var message = (m[4] || m[5]) ? i18n.NO_PIECE_CAN_MOVE_TO_DISAMBIGUATION : i18n.NO_PIECE_CAN_MOVE_TO;
			throw new exception.InvalidNotation(position, notation, message, m[3], m[7]);
		}

		// Compute the move descriptor for each remaining "from"-square candidate
		for(var i=0; i<attackers.length; ++i) {
			var currentDescriptor = isKingSafeAfterMove(position, attackers[i], to, -1, -1);
			if(currentDescriptor) {
				if(descriptor !== null) {
					throw new exception.InvalidNotation(position, notation, i18n.REQUIRE_DISAMBIGUATION, m[3], m[7]);
				}
				descriptor = currentDescriptor;
			}
		}
		if(descriptor === null) {
			var message = position._turn===WHITE ? i18n.NOT_SAFE_FOR_WHITE_KING : i18n.NOT_SAFE_FOR_BLACK_KING;
			throw new exception.InvalidNotation(position, notation, message);
		}

		// STRICT-MODE -> check the disambiguation symbol.
		if(strict) {
			var expectedDS = getDisambiguationSymbol(position, descriptor._from, to);
			var observedDS = (m[4] ? m[4] : '') + (m[5] ? m[5] : '');
			if(expectedDS !== observedDS) {
				throw new exception.InvalidNotation(position, notation, i18n.WRONG_DISAMBIGUATION_SYMBOL, expectedDS, observedDS);
			}
		}
	}

	// Pawn move
	else if(m[10]) {
		var to = parseSquare(m[10]);
		if(m[8]) {
			descriptor = getPawnCaptureDescriptor(position, notation, COLUMN_SYMBOL.indexOf(m[8]), to);
		}
		else {
			descriptor = getPawnAdvanceDescriptor(position, notation, to);
		}

		// Ensure that the pawn move do not let a king is check.
		if(!descriptor) {
			var message = position._turn===WHITE ? i18n.NOT_SAFE_FOR_WHITE_KING : i18n.NOT_SAFE_FOR_BLACK_KING;
			throw new exception.InvalidNotation(position, notation, message);
		}

		// Detect promotions
		if(to<8 || to>=112) {
			if(!m[12]) {
				throw new exception.InvalidNotation(position, notation, i18n.MISSING_PROMOTION);
			}
			var promotion = PIECE_SYMBOL.indexOf(m[12].toLowerCase());
			if(!isPromotablePiece(promotion)) {
				throw new exception.InvalidNotation(position, notation, i18n.INVALID_PROMOTED_PIECE, m[12]);
			}
			descriptor = new MoveDescriptor(descriptor, promotion);

			// STRICT MODE -> do not forget the `=` character!
			if(strict && !m[11]) {
				throw new exception.InvalidNotation(position, notation, i18n.MISSING_PROMOTION_SYMBOL);
			}
		}

		// Detect illegal promotion attempts!
		else if(m[12]) {
			throw new exception.InvalidNotation(position, notation, i18n.ILLEGAL_PROMOTION);
		}
	}

	// STRICT MODE
	if(strict) {
		if(descriptor.isCapture() !== (m[6] || m[9])) {
			var message = descriptor.isCapture() ? i18n.MISSING_CAPTURE_SYMBOL : i18n.INVALID_CAPTURE_SYMBOL;
			throw new exception.InvalidNotation(position, notation, message);
		}
		var expectedCCS = getCheckCheckmateSymbol(position, descriptor);
		var observedCCS = m[13] ? m[13] : '';
		if(expectedCCS !== observedCCS) {
			throw new exception.InvalidNotation(position, notation, i18n.WRONG_CHECK_CHECKMATE_SYMBOL, expectedCCS, observedCCS);
		}
	}

	// Final result
	return descriptor;
}


/**
 * Delegate function for capture pawn move parsing.
 *
 * @param {Position} position
 * @param {string} notation
 * @param {number} columnFrom
 * @param {number} to
 * @returns {boolean|MoveDescriptor}
 */
function getPawnCaptureDescriptor(position, notation, columnFrom, to) {

	// Ensure that `to` is not on the 1st row.
	var from = to - 16 + position._turn*32;
	if((from /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)!==0) {
		throw new exception.InvalidNotation(position, notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
	}

	// Compute the "from"-square.
	var columnTo = to % 16;
	if(columnTo - columnFrom === 1) { from -= 1; }
	else if(columnTo - columnFrom === -1) { from += 1; }
	else {
		throw new exception.InvalidNotation(position, notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "from"-square
	if(position._board[from] !== PAWN*2+position._turn) {
		throw new exception.InvalidNotation(position, notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "to"-square
	var toContent = position._board[to];
	if(toContent < 0) {
		if(to === (5-position._turn*3)*16 + position._enPassant) { // detecting "en-passant" captures
			return isKingSafeAfterMove(position, from, to, (4-position._turn)*16 + position._enPassant, -1);
		}
	}
	else if(toContent % 2 !== position._turn) { // detecting regular captures
		return isKingSafeAfterMove(position, from, to, -1, -1);
	}

	throw new exception.InvalidNotation(position, notation, i18n.INVALID_CAPTURING_PAWN_MOVE);
}


/**
 * Delegate function for non-capturing pawn move parsing.
 *
 * @param {Position} position
 * @param {string} notation
 * @param {number} to
 * @returns {boolean|MoveDescriptor}
 */
function getPawnAdvanceDescriptor(position, notation, to) {

	// Ensure that `to` is not on the 1st row.
	var offset = 16 - position._turn*32;
	var from = to - offset;
	if((from /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)!==0) {
		throw new exception.InvalidNotation(position, notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "to"-square
	if(position._board[to] >= 0) {
		throw new exception.InvalidNotation(position, notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
	}

	// Check the content of the "from"-square
	var expectedFromContent = PAWN*2+position._turn;
	if(position._board[from] === expectedFromContent) {
		return isKingSafeAfterMove(position, from, to, -1, -1);
	}

	// Look for two-square pawn moves
	else if(position._board[from] < 0) {
		from -= offset;
		var firstSquareOfRow = (1 + position._turn*5) * 16;
		if(from >= firstSquareOfRow && from < firstSquareOfRow+8 && position._board[from] === expectedFromContent) {
			return isKingSafeAfterMove(position, from, to, -1, to % 16);
		}
	}

	throw new exception.InvalidNotation(position, notation, i18n.INVALID_NON_CAPTURING_PAWN_MOVE);
}



// ---------------------------------------------------------------------------
// Public objects
// ---------------------------------------------------------------------------


exports.i18n = i18n;
exports.exception = exception;
exports.squareColor = squareColor;
exports.squareToCoordinates = squareToCoordinates;
exports.Position = Position;
exports.movetype = movetype;
exports.MoveDescriptor = MoveDescriptor;
