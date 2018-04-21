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


/**
 * Exception thrown when an invalid argument is passed to a function.
 *
 * @param {string} fun
 */
exports.IllegalArgument = function(fun) {
	this.fun = fun;
};


/**
 * Exception thrown by the FEN parsing function.
 *
 * @param {string} fen String whose parsing leads to an error.
 * @param {string} message Human-readable error message.
 * @param ...
 */
exports.InvalidFEN = function(fen, message) {
	this.fen = fen;
	this.message = message;
	for(var i=2; i<arguments.length; ++i) {
		var re = new RegExp('%' + (i-1) + '\\$s');
		this.message = this.message.replace(re, arguments[i]);
	}
};


/**
 * Exception thrown by the move notation parsing function.
 *
 * @param {string} fen FEN-representation of the position used to try to parse the move notation.
 * @param {string} notation String whose parsing leads to an error.
 * @param {string} message Human-readable error message.
 * @param ...
 */
exports.InvalidNotation = function(fen, notation, message) {
	this.fen = fen;
	this.notation = notation;
	this.message = message;
	for(var i=3; i<arguments.length; ++i) {
		var re = new RegExp('%' + (i-2) + '\\$s');
		this.message = this.message.replace(re, arguments[i]);
	}
};


/**
 * Exception thrown by the PGN parsing functions.
 *
 * @param {string} pgn String whose parsing leads to an error.
 * @param {number} index Character index in the string where the parsing fails (`-1` if no particular character is targeted).
 * @param {string} message Human-readable error message.
 * @param ...
 */
exports.InvalidPGN = function(pgn, index, message) {
	this.pgn = pgn;
	this.index = index;
	this.message = message;
	for(var i=3; i<arguments.length; ++i) {
		var re = new RegExp('%' + (i-2) + '\\$s');
		this.message = this.message.replace(re, arguments[i]);
	}
};
