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


/**
 * @module exception
 * @description This module defines the exceptions used by the library.
 */



/**
 * @class
 * @classdesc Exception thrown when an invalid argument is passed to a function.
 * @static
 */
var IllegalArgument = exports.IllegalArgument = function(functionName) {

	/**
	 * Name of the function that raises the exception.
	 * @member {string}
	 */
	this.functionName = functionName;
};

IllegalArgument.prototype.toString = function() {
	return 'Illegal argument in function ' + this.functionName;
};



/**
 * @class
 * @classdesc Exception thrown by the FEN parsing functions.
 * @static
 */
var InvalidFEN = exports.InvalidFEN = function(fen, message) {

	/**
	 * FEN string that causes the error.
	 * @member {string}
	 */
	this.fen = fen;

	/**
	 * Human-readable message describing the error.
	 * @member {string}
	 */
	this.message = buildMessage(message, 2, arguments);
};

InvalidFEN.prototype.toString = function() {
	return toStringImpl('InvalidFEN', this.message);
};



/**
 * @class
 * @classdesc Exception thrown by the move notation parsing functions.
 * @static
 */
var InvalidNotation = exports.InvalidNotation = function(fen, notation, message) {

	/**
	 * FEN representation of the position used to interpret the move notation.
	 * @member {string}
	 */
	this.fen = fen;

	/**
	 * Move notation that causes the error.
	 * @member {string}
	 */
	this.notation = notation;

	/**
	 * Human-readable message describing the error.
	 * @member {string}
	 */
	this.message = buildMessage(message, 3, arguments);
};

InvalidNotation.prototype.toString = function() {
	return toStringImpl('InvalidNotation', this.message);
};


/**
 * @class
 * @classdesc Exception thrown by the PGN parsing functions.
 * @static
 */
var InvalidPGN = exports.InvalidPGN = function(pgn, index, lineNumber, message) {

	/**
	 * PGN string that causes the error.
	 * @member {string}
	 */
	this.pgn = pgn;

	/**
	 * Index (0-based) of the character in the PGN string where the parsing fails (or a negative value is no particular character is related to the error).
	 * @member {number}
	 */
	this.index = index;

	/**
	 * Index (1-based) of the line in the PGN string where the parsing fails (or a negative value is no particular character is related to the error).
	 */
	this.lineNumber = lineNumber;

	/**
	 * Human-readable message describing the error.
	 * @member {string}
	 */
	this.message = buildMessage(message, 4, arguments);
};

InvalidPGN.prototype.toString = function() {
	return toStringImpl('InvalidPGN', '[character=' + this.index + ' line=' + this.lineNumber + '] ' + this.message);
};



function buildMessage(message, offset, tokens) {
	return message.replace(/{(\d+)}/g, function(match, index) {
		index = Number(index) + offset;
		return index < tokens.length ? tokens[index] : match;
	});
}


function toStringImpl(exceptionName, message) {
	return exceptionName + ' -> ' + message;
}
