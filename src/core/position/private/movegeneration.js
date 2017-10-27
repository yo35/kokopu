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
var attacks = require('./attacks');
var legality = require('./legality');
var moveDescriptor = require('./movedescriptor');


exports.isCheck = function(position) {
	return legality.isLegal(position) && attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
};


exports.isCheckmate = function(position) {
	return legality.isLegal(position) && !hasMove(position) && attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
};


exports.isStalemate = function(position) {
	return legality.isLegal(position) && !hasMove(position) && !attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
};


var hasMove = exports.hasMove = function(position) {
	function MoveFound() {}
	try {
		generateMoves(position, function(descriptor) {
			if(descriptor) { throw new MoveFound(); }
		});
		return false;
	}
	catch(err) {
		if(err instanceof MoveFound) { return true; }
		else { throw err; }
	}
};


exports.moves = function(position) {
	var res = [];
	generateMoves(position, function(descriptor, generatePromotions) {
		if(descriptor) {
			if(generatePromotions) {
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.QUEEN , descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.ROOK  , descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.BISHOP, descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.KNIGHT, descriptor._optionalPiece));
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
		if(movingPiece === bt.PAWN) {

			// Capturing moves
			var attackDirections = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<attackDirections.length; ++i) {
				var to = from + attackDirections[i];
				if((to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var toContent = position._board[to];
					if(toContent >= 0 && toContent%2 !== position._turn) { // regular capturing move
						fun(isKingSafeAfterMove(position, from, to, -1), to<8 || to>=112);
					}
					else if(toContent < 0 && to === (5-position._turn*3)*16 + position._enPassant) { // en-passant move
						fun(isKingSafeAfterMove(position, from, to, (4-position._turn)*16 + position._enPassant), false);
					}
				}
			}

			// Non-capturing moves
			var moveDirection = 16 - position._turn*32;
			var to = from + moveDirection;
			if(position._board[to] < 0) {
				fun(isKingSafeAfterMove(position, from, to, -1), to<8 || to>=112);

				// 2-square pawn move
				var firstSquareOfRow = (1 + position._turn*5) * 16;
				if(from>=firstSquareOfRow && from<firstSquareOfRow+8) {
					to += moveDirection;
					if(position._board[to] < 0) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
				}
			}
		}
		
		// Generate moves for non-sliding non-pawn pieces
		else if(movingPiece===bt.KNIGHT || movingPiece===bt.KING) {
			var directions = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				var to = from + directions[i];
				if((to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var toContent = position._board[to];
					if(toContent < 0 || toContent%2 !== position._turn) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
				}
			}
		}

		// Generate moves for sliding pieces
		else {
			var directions = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				for(var to=from+directions[i]; (to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0; to+=directions[i]) {
					var toContent = position._board[to];
					if(toContent < 0 || toContent%2 !== position._turn) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
					if(toContent >= 0) { break; }
				}
			}
		}

		// Generate castling moves
		if(movingPiece === bt.KING && position._castling[position._turn] !== 0) {
			var to = [from-2, from+2];
			for(var i=0; i<to.length; ++i) {
				fun(isCastlingLegal(position, from, to[i]), false);
			}
		}
	}
}


/**
 * Check whether the current player king is in check after moving from `from` to `to`.
 *
 * This function implements the verification steps (7) to (9) as defined in {@link #isMoveLegal}
 *
 * @param {number} enPassantSquare Index of the square where the "en-passant" taken pawn lies if any, `-1` otherwise.
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
function isKingSafeAfterMove(position, from, to, enPassantSquare) {
	var fromContent = position._board[from];
	var toContent   = position._board[to  ];
	var movingPiece = Math.floor(fromContent / 2);

	// Step (7) -> Execute the displacement (castling moves are processed separately).
	position._board[to  ] = fromContent;
	position._board[from] = bt.EMPTY;
	if(enPassantSquare >= 0) {
		position._board[enPassantSquare] = bt.EMPTY;
	}

	// Step (8) -> Is the king safe after the displacement?
	var kingSquare    = movingPiece===bt.KING ? to : position._king[position._turn];
	var kingIsInCheck = attacks.isAttacked(position, kingSquare, 1-position._turn);

	// Step (9) -> Reverse the displacement.
	position._board[from] = fromContent;
	position._board[to  ] = toContent;
	if(enPassantSquare >= 0) {
		position._board[enPassantSquare] = bt.PAWN*2 + 1-position._turn;
	}

	// Final result
	if(kingIsInCheck) {
		return false;
	}
	else {
		if(enPassantSquare >= 0) {
			return moveDescriptor.makeEnPassant(from, to, enPassantSquare, position._turn);
		}
		else {
			return moveDescriptor.make(from, to, position._turn, movingPiece, toContent);
		}
	}
}


/**
 * Delegated method for checking whether a castling move is legal or not.
 *
 * TODO: make it chess-960 compatible.
 */
function isCastlingLegal(position, from, to) {

	// Ensure that the given underlying castling is allowed.
	var column = from < to ? 7 : 0;
	if((position._castling[position._turn] /* jshint bitwise:false */ & 1<<column /* jshint bitwise:true */) === 0) {
		return false;
	}

	// Origin and destination squares of the rook involved in the move.
	var rookFrom = column + position._turn*112;
	var rookTo   = (from + to) / 2;

	// Ensure that each square between the king and the rook is empty.
	var offset = from < rookFrom ? 1 : -1;
	for(var sq=from+offset; sq!==rookFrom; sq+=offset) {
		if(position._board[sq] !== bt.EMPTY) { return false; }
	}

	// The origin and destination squares of the king, and the square between them must not be attacked.
	var byWho = 1-position._turn;
	if(attacks.isAttacked(position, from, byWho) || attacks.isAttacked(position, to, byWho) || attacks.isAttacked(position, rookTo, byWho)) {
		return false;
	}

	// The move is legal -> generate the move descriptor.
	return moveDescriptor.makeCastling(from, to, rookFrom, rookTo, position._turn);
}
