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
var exception = require('../exception');
var i18n = require('../i18n');
var fen = require('./fen');
var legality = require('./legality');
var moveGeneration = require('./movegeneration');


/**
 * Convert the given move descriptor to UCI notation.
 */
exports.getNotation = function(position, descriptor, forceKxR) {
	var res = descriptor.from();

	if(descriptor.isCastling()) {
		res += forceKxR || position.variant === bt.CHESS960 ? descriptor.rookFrom() : descriptor.to();
	}
	else {
		res += descriptor.to();
	}

	if(descriptor.isPromotion()) {
		res += descriptor.promotion();
	}

	return res;
};


/**
 * Parse a UCI notation for the given position.
 *
 * @returns {MoveDescriptor}
 * @throws InvalidNotation
 */
exports.parseNotation = function(position, notation, strict) {

	// General syntax
	var m = /^([a-h][1-8])([a-h][1-8])([kqrbnp]?)$/.exec(notation);
	if(m === null) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.INVALID_UCI_NOTATION_SYNTAX);
	}

	// Ensure that the position is legal (this is also done in `moveGeneration.isMoveLegal(..)`, but performing this check beforehand
	// allows to fill the exception with an error message that is more explicit).
	if(!legality.isLegal(position)) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_POSITION);
	}

	// m[1] - from
	// m[2] - to
	// m[3] - promotion piece

	var from = bt.squareFromString(m[1]);
	var to = bt.squareFromString(m[2]);
	var kxrSubstitutionApplied = false;
	var expectedRookFrom = null; // non-null only if KxR substitution has been applied.

	// If KxR is detected (and allowed), try to replace
	if(position.variant !== bt.CHESS960 && !strict && position.board[from] !== bt.EMPTY && position.board[to] !== bt.EMPTY && position.board[from]%2 === position.board[to]%2) {
		var fromPiece = Math.floor(position.board[from] / 2);
		var toPiece = Math.floor(position.board[to] / 2);
		if(fromPiece === bt.KING && toPiece === bt.ROOK) {
			kxrSubstitutionApplied = true;
			expectedRookFrom = to;
			to = position.turn * 112 + (from < to ? 6 : 2);
		}
	}

	// Perform move analysis.
	var result = moveGeneration.isMoveLegal(position, from, to);

	// No legal move.
	if(!result) {
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_UCI_MOVE);
	}

	// Manage promotion.
	if(result.type === 'promotion') {
		var promotion = bt.pieceFromString(m[3]);
		if(promotion < 0 || promotion === bt.PAWN || (promotion === bt.KING && position.variant !== bt.ANTICHESS)) {
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_UCI_MOVE);
		}
		result = result.build(promotion);
	}
	else if(m[3] !== '') { // Throw if a promotion piece is provided while no promotion happens.
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_UCI_MOVE);
	}

	// Manage KxR substitution.
	if(result.isCastling()) {
		if(kxrSubstitutionApplied && expectedRookFrom !== result._optionalSquare1) { // If KxR substitution has been applied, ensure that the rook-from square is what it is supposed to be.
			throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_UCI_MOVE);
		}
	}
	else if(kxrSubstitutionApplied) { // If KxR substitution has been applied, a castling move must be found.
		throw new exception.InvalidNotation(fen.getFEN(position, 0, 1), notation, i18n.ILLEGAL_UCI_MOVE);
	}

	return result;
};
