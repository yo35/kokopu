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


// Attack directions per colored piece.
var ATTACK_DIRECTIONS = exports.ATTACK_DIRECTIONS = [
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



// -----------------------------------------------------------------------------
// isAttacked
// -----------------------------------------------------------------------------

/**
 * Check if any piece of the given color attacks a given square.
 */
exports.isAttacked = function(position, square, attackerColor) {
	return isAttackedByNonSliding(position, square, bt.KING*2 + attackerColor) ||
		isAttackedByNonSliding(position, square, bt.KNIGHT*2 + attackerColor) ||
		isAttackedByNonSliding(position, square, bt.PAWN*2 + attackerColor) ||
		isAttackedBySliding(position, square, bt.ROOK*2 + attackerColor, bt.QUEEN*2 + attackerColor) ||
		isAttackedBySliding(position, square, bt.BISHOP*2 + attackerColor, bt.QUEEN*2 + attackerColor);
};


function isAttackedByNonSliding(position, square, nonSlidingAttacker) {
	var directions = ATTACK_DIRECTIONS[nonSlidingAttacker];
	for(var i=0; i<directions.length; ++i) {
		var sq = square - directions[i];
		if((sq & 0x88) === 0 && position.board[sq] === nonSlidingAttacker) {
			return true;
		}
	}
	return false;
}


function isAttackedBySliding(position, square, slidingAttacker, queenAttacker) {
	var directions = ATTACK_DIRECTIONS[slidingAttacker];
	for(var i=0; i<directions.length; ++i) {
		var sq = square;
		while(true) {
			sq -= directions[i];
			if((sq & 0x88)===0) {
				var cp = position.board[sq];
				if(cp === bt.EMPTY) { continue; }
				else if(cp === slidingAttacker || cp===queenAttacker) { return true; }
			}
			break;
		}
	}
	return false;
}



// -----------------------------------------------------------------------------
// getAttacks
// -----------------------------------------------------------------------------

/**
 * Return the squares from which a piece of the given color attacks a given square.
 */
exports.getAttacks = function(position, square, attackerColor) {
	var result = [];
	findNonSlidingAttacks(position, square, result, bt.KING*2 + attackerColor);
	findNonSlidingAttacks(position, square, result, bt.KNIGHT*2 + attackerColor);
	findNonSlidingAttacks(position, square, result, bt.PAWN*2 + attackerColor);
	findSlidingAttacks(position, square, result, bt.ROOK*2 + attackerColor, bt.QUEEN*2 + attackerColor);
	findSlidingAttacks(position, square, result, bt.BISHOP*2 + attackerColor, bt.QUEEN*2 + attackerColor);
	return result;
};


function findNonSlidingAttacks(position, square, result, nonSlidingAttacker) {
	var directions = ATTACK_DIRECTIONS[nonSlidingAttacker];
	for(var i=0; i<directions.length; ++i) {
		var sq = square - directions[i];
		if((sq & 0x88) === 0 && position.board[sq] === nonSlidingAttacker) {
			result.push(sq);
		}
	}
}


function findSlidingAttacks(position, square, result, slidingAttacker, queenAttacker) {
	var directions = ATTACK_DIRECTIONS[slidingAttacker];
	for(var i=0; i<directions.length; ++i) {
		var sq = square;
		while(true) {
			sq -= directions[i];
			if((sq & 0x88) === 0) {
				var cp = position.board[sq];
				if(cp === bt.EMPTY) { continue; }
				else if(cp === slidingAttacker || cp === queenAttacker) { result.push(sq); }
			}
			break;
		}
	}
}
