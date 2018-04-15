/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
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


var bt = require('../basetypes');


var CASTLING_FLAG   = 0x01;
var EN_PASSANT_FLAG = 0x02;
var CAPTURE_FLAG    = 0x04;
var PROMOTION_FLAG  = 0x08;


exports.make = function(from, to, color, movingPiece, capturedPiece) {
	var flags = capturedPiece >= 0 ? CAPTURE_FLAG : 0x00;
	var movingColoredPiece = movingPiece*2 + color;
	return new MoveDescriptor(flags, from, to, movingColoredPiece, movingColoredPiece, capturedPiece, -1, -1);
};


exports.makeCastling = function(from, to, rookFrom, rookTo, color) {
	var movingKing = bt.KING*2 + color;
	var movingRook = bt.ROOK*2 + color;
	return new MoveDescriptor(CASTLING_FLAG, from, to, movingKing, movingKing, movingRook, rookFrom, rookTo);
};


exports.makeEnPassant = function(from, to, enPassantSquare, color) {
	var flags = EN_PASSANT_FLAG /* jshint bitwise:false */ | CAPTURE_FLAG /* jshint bitwise:true */;
	var movingPawn = bt.PAWN*2 + color;
	var capturedPawn = bt.PAWN*2 + 1 - color;
	return new MoveDescriptor(flags, from, to, movingPawn, movingPawn, capturedPawn, enPassantSquare, -1);
};


exports.makePromotion = function(from, to, color, promotion, capturedPiece) {
	var flags = PROMOTION_FLAG /* jshint bitwise:false */ | (capturedPiece >= 0 ? CAPTURE_FLAG : 0x00) /* jshint bitwise:true */;
	var movingPawn = bt.PAWN*2 + color;
	var finalPiece = promotion*2 + color;
	return new MoveDescriptor(flags, from, to, movingPawn, finalPiece, capturedPiece, -1, -1);
};


/**
 * @classdesc
 * Hold the raw information that is required to play a move in a given position.
 */
function MoveDescriptor(flags, from, to, movingPiece, finalPiece, optionalPiece, optionalSquare1, optionalSquare2) {
	this._type            = flags          ;
	this._from            = from           ;
	this._to              = to             ;
	this._movingPiece     = movingPiece    ;
	this._finalPiece      = finalPiece     ;
	this._optionalPiece   = optionalPiece  ; // Captured piece in case of capture, moving rook in case of castling.
	this._optionalSquare1 = optionalSquare1; // Rook-from or en-passant square.
	this._optionalSquare2 = optionalSquare2; // Rook-to.
}


/**
 * Whether the given object is a move descriptor or not.
 */
exports.isInstanceOf = function(obj) {
	return obj instanceof MoveDescriptor;
};


MoveDescriptor.prototype.isCastling = function() {
	return (this._type /* jshint bitwise:false */ & CASTLING_FLAG /* jshint bitwise:true */) !== 0;
};


MoveDescriptor.prototype.isEnPassant = function() {
	return (this._type /* jshint bitwise:false */ & EN_PASSANT_FLAG /* jshint bitwise:true */) !== 0;
};


MoveDescriptor.prototype.isCapture = function() {
	return (this._type /* jshint bitwise:false */ & CAPTURE_FLAG /* jshint bitwise:true */) !== 0;
};


MoveDescriptor.prototype.isPromotion = function() {
	return (this._type /* jshint bitwise:false */ & PROMOTION_FLAG /* jshint bitwise:true */) !== 0;
};


MoveDescriptor.prototype.from = function() {
	return bt.squareToString(this._from);
};


MoveDescriptor.prototype.to = function() {
	return bt.squareToString(this._to);
};


MoveDescriptor.prototype.movingPiece = function() {
	return bt.squareToString(this._to);
};


MoveDescriptor.prototype.toString = function() {
	var result = bt.squareToString(this._from) + bt.squareToString(this._to);
	if(this.isPromotion()) {
		result += bt.pieceToString(Math.floor(this._finalPiece / 2)).toUpperCase();
	}
	return result;
};
