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


var bt = require('../basetypes');
var attacks = require('./attacks');


/**
 * Check whether the given position is legal or not.
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
	refreshKingSquare(position, bt.WHITE);
	refreshKingSquare(position, bt.BLACK);
	if(position.king[bt.WHITE] < 0 || position.king[bt.BLACK] < 0) {
		return;
	}

	// Condition (2)
	if(attacks.isAttacked(position, position.king[1-position.turn], position.turn)) {
		return;
	}

	// Condition (3)
	for(var c=0; c<8; ++c) {
		var cp1 = position.board[c];
		var cp8 = position.board[112 + c];
		if(cp1 === bt.WP || cp8 === bt.WP || cp1 === bt.BP || cp8 === bt.BP) {
			return;
		}
	}

	// Condition (4)
	var isCastlingFlagLegalFun = position.variant === bt.CHESS_960 ? isCastlingFlagLegalForChess960 : isCastlingFlagLegalForRegularChess;
	for(var color=0; color<2; ++color) {
		if(!isCastlingFlagLegalFun(position, color)) {
			return;
		}
	}

	// Condition (5)
	if(position.enPassant >= 0) {
		var square2 = (6-position.turn*5)*16 + position.enPassant;
		var square3 = (5-position.turn*3)*16 + position.enPassant;
		var square4 = (4-position.turn  )*16 + position.enPassant;
		if(!(position.board[square2]===bt.EMPTY && position.board[square3]===bt.EMPTY && position.board[square4]===bt.PAWN*2+1-position.turn)) {
			return;
		}
	}

	// At this point, all the conditions (1) to (5) hold, so the position can be flagged as legal.
	position.legal = true;
};


/**
 * Detect the kings of the given color that are present on the chess board.
 */
function refreshKingSquare(position, color) {
	var target = bt.KING*2 + color;
	position.king[color] = -1;
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
				return;
			}
		}
	}
}


function isCastlingFlagLegalForRegularChess(position, color) {
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
