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
var moveGeneration = require('./movegeneration');


/**
 * Convert the given move descriptor to standard algebraic notation.
 */
exports.getNotation = function(position, descriptor) {
	var res = '';

	// Castling move
	if(descriptor.isCastling()) {
		res = descriptor._from < descriptor._to ? 'O-O' : 'O-O-O';
	}

	// Pawn move
	else if(Math.floor(descriptor._movingPiece / 2) === bt.PAWN) {
		if(descriptor.isCapture()) {
			res += bt.fileToString(descriptor._from % 16) + 'x';
		}
		res += bt.squareToString(descriptor._to);
		if(descriptor.isPromotion()) {
			res += '=' + bt.pieceToString(Math.floor(descriptor._finalPiece / 2)).toUpperCase();
		}
	}

	// Non-pawn move
	else {
		res += bt.pieceToString(Math.floor(descriptor._movingPiece / 2)).toUpperCase();
		res += getDisambiguationSymbol(position, descriptor._from, descriptor._to);
		if(descriptor.isCapture()) {
			res += 'x';
		}
		res += bt.squareToString(descriptor._to);
	}

	// Check/checkmate detection and final result.
	res += getCheckCheckmateSymbol(position, descriptor);
	return res;
};


/**
 * Return the check/checkmate symbol to use for a move.
 */
function getCheckCheckmateSymbol(position, descriptor) {
	//var nextPosition = new Position(position);
	//moveGeneration.play(nextPosition, descriptor);
	//return nextPosition.isCheck() ? (nextPosition.hasMove() ? '+' : '#') : '';
	return ''; // TODO
}


/**
 * Return the disambiguation symbol to use for a move from `from` to `to`.
 */
function getDisambiguationSymbol(position, from, to) {
	var attackers = attacks.getAttacks(position, to, position._turn).filter(function(sq) { return position._board[sq]===position._board[from]; });
		
	// Disambiguation is not necessary if there less than 2 attackers.
	if(attackers.length < 2) {
		return '';
	}

	var foundNotPined = false;
	var foundOnSameRank = false;
	var foundOnSameFile = false;
	var rankFrom = Math.floor(from / 16);
	var fileFrom = from % 16;
	for(var i=0; i<attackers.length; ++i) {
		var sq = attackers[i];
		if(sq === from || isPinned(position, sq)) { continue; }
		
		foundNotPined = true;
		if(rankFrom === Math.floor(sq / 16)) { foundOnSameRank = true; }
		if(fileFrom === sq % 16) { foundOnSameFile = true; }
	}
	
	if(foundOnSameFile) {
		return foundOnSameRank ? bt.squareToString(from) : bt.rankToString(rankFrom);
	}
	else {
		return foundNotPined ? bt.fileToString(fileFrom) : '';
	}
}


/**
 * Whether the piece on the given square is pinned or not.
 */
function isPinned(position, sq) {
	var content = position._board[sq];
	position._board[sq] = bt.EMPTY;
	var result = attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
	position._board[sq] = content;
	return result;
}
