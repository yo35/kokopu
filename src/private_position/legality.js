/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2021  Yoann Le Montagner <yo35 -at- melix.net>       *
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


var bt = require('../basetypes');
var attacks = require('./attacks');


/**
 * Check whether the given position is legal or not.
 *
 * A position is considered to be legal if all the following conditions are met:
 *
 *  1. There is exactly one white king and one black king on the board (or more generally,
	     the number of kings on the board matches the game variant of the position).
 *  2. Special condition regarding positions in which one of the player (or both) has no piece.
 *  3. The player that is not about to play is not check (this condition is omitted for variants in which kings has no "royal power").
 *  4. There are no pawn on rows 1 and 8.
 *  5. For each colored castle flag set, there is a rook and a king on the
 *     corresponding initial squares.
 *  6. The pawn situation is consistent with the en-passant flag if it is set.
 *     For instance, if it is set to the 'e' column and black is about to play,
 *     the squares e2 and e3 must be empty, and there must be a white pawn on e4.
 */
exports.isLegal = function(position) {
	refreshLegalFlagAndKingSquares(position);
	return position.legal;
};


/**
 * Refresh the legal flag of the given position if it is set to null
 * (which means that the legality state of the position is unknown).
 *
 * Together with the legal flag, the reference to the squares where the white and
 * black kings lie is updated by this function.
 */
var refreshLegalFlagAndKingSquares = exports.refreshLegalFlagAndKingSquares = function(position) {
	if(position.legal !== null) {
		return;
	}
	position.legal = false;

	// Condition (1)
	var whiteKingOK = refreshKingSquare(position, bt.WHITE);
	var blackKingOK = refreshKingSquare(position, bt.BLACK);
	if(!whiteKingOK || !blackKingOK) {
		return;
	}

	// Condition (2)
	if (position.variant === bt.ANTICHESS) {
		if (!hasAtLeastOnePiece(position, 1-position.turn)) { // The player that has just played must have at least one piece in antichess.
			return;
		}
	}
	else if (position.variant === bt.HORDE) {
		if (position.turn === bt.BLACK && !hasAtLeastOnePiece(position, bt.WHITE)) { // White must have at least one piece if he/she has just played in horde chess.
			return;
		}
	}

	// Condition (3)
	if(position.king[1-position.turn] >= 0 && attacks.isAttacked(position, position.king[1-position.turn], position.turn)) {
		return;
	}

	// Condition (4)
	var forbiddenCPWhite1 = position.variant === bt.HORDE ? bt.INVALID : bt.WP;
	for(var c=0; c<8; ++c) {
		var cp1 = position.board[c];
		var cp8 = position.board[112 + c];
		if (cp1 === forbiddenCPWhite1 || cp8 === bt.WP || cp1 === bt.BP || cp8 === bt.BP) {
			return;
		}
	}

	// Condition (5)
	var isCastlingFlagLegalFun = position.variant === bt.CHESS960 ? isCastlingFlagLegalForChess960 : isCastlingFlagLegalForRegularChess;
	for(var color=0; color<2; ++color) {
		if(!isCastlingFlagLegalFun(position, color)) {
			return;
		}
	}

	// Condition (6)
	if(position.enPassant >= 0) {
		var square2 = (6-position.turn*5)*16 + position.enPassant;
		var square3 = (5-position.turn*3)*16 + position.enPassant;
		var square4 = (4-position.turn  )*16 + position.enPassant;
		if(!(position.board[square2]===bt.EMPTY && position.board[square3]===bt.EMPTY && position.board[square4]===bt.PAWN*2+1-position.turn)) {
			return;
		}
	}

	// At this point, all the conditions (1) to (6) hold, so the position can be flagged as legal.
	position.legal = true;
};


/**
 * Detect the kings of the given color that are present on the chess board.
 */
function refreshKingSquare(position, color) {
	var target = bt.KING*2 + color;
	position.king[color] = -1;

	// Expectation: king may be present (even several times), and it has no royal power.
	if (position.variant === bt.ANTICHESS) {
		return true;
	}

	// Expectation: no king of the given color is supposed to be present on the board.
	else if (position.variant === bt.NO_KING || position.variant === bt.BLACK_KING_ONLY - color || (position.variant === bt.HORDE && color === bt.WHITE)) {
		for(var sq=0; sq<120; sq += (sq & 0x7)===7 ? 9 : 1) {
			if(position.board[sq] === target) {
				return false;
			}
		}
		return true;
	}

	// Expectation: exactly 1 king of the given color is supposed to be present on the board,
	// and it has royal power.
	else {
		for(var sq=0; sq<120; sq += (sq & 0x7)===7 ? 9 : 1) {
			if(position.board[sq] === target) {

				// If the targeted king is detected on the square sq, two situations may occur:
				// 1) No king was detected on the previously visited squares: then the current
				//    square is saved, and loop over the next board squares goes on.
				if(position.king[color] < 0) {
					position.king[color] = sq;
				}

				// 2) Another king was detected on the previously visited squares: then the buffer position.king[color]
				//    is set to the invalid state (-1), and the loop is interrupted.
				else {
					position.king[color] = -1;
					return false;
				}
			}
		}
		return position.king[color] >= 0;
	}
}


/**
 * Detect whether the player with the given color has at least one piece or not.
 */
function hasAtLeastOnePiece(position, color) {
	for(var sq=0; sq<120; sq += (sq & 0x7)===7 ? 9 : 1) {
		if(position.board[sq] >= 0 && position.board[sq]%2 === color) {
			return true;
		}
	}
	return false;
}


function isCastlingFlagLegalForRegularChess(position, color) {
	if (position.king[color] < 0) {
		return position.castling[color] === 0;
	}
	var skipOO  = (position.castling[color] & 0x80) === 0;
	var skipOOO = (position.castling[color] & 0x01) === 0;
	var rookHOK = skipOO              || position.board[7 + 112*color] === bt.ROOK*2 + color;
	var rookAOK = skipOOO             || position.board[0 + 112*color] === bt.ROOK*2 + color;
	var kingOK  = (skipOO && skipOOO) || position.board[4 + 112*color] === bt.KING*2 + color;
	return kingOK && rookAOK && rookHOK;
}


function isCastlingFlagLegalForChess960(position, color) {
	var files = [];
	for(var file=0; file<8; ++file) {
		if((position.castling[color] & 1 << file) === 0) {
			continue;
		}

		// Ensure there is a rook on each square for which the corresponding file flag is set.
		if(position.board[file + 112*color] !== bt.ROOK*2 + color) {
			return;
		}
		files.push(file);
	}

	// Additional check on the king position, depending on the number of file flags.
	switch(files.length) {
		case 0: return true;

		// 1 possible castle -> ensure the king is on the initial rank.
		case 1: return position.king[color] >= 112*color && position.king[color] <= 7 + 112*color;

		// 2 possible castles -> ensure the king is between the two rooks.
		case 2: return position.king[color] > files[0] + 112*color && position.king[color] < files[1] + 112*color;

		default: return false;
	}
}
