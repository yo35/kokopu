/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2022  Yoann Le Montagner <yo35 -at- melix.net>       *
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
 * -------------------------------------------------------------------------- */


/**
 * This module contains the exceptions used by the library.
 * @module
 */


/**
 * Exception thrown when an invalid argument is passed to a function.
 */
export class IllegalArgument {

	/** Name of the function that raises the exception. */
	functionName: string;

	constructor(functionName: string) {
		this.functionName = functionName;
	}

	/**
	 * @ignore
	 */
	toString(): string {
		return `Illegal argument in function ${this.functionName}`;
	}
}


/**
 * Exception thrown by the FEN parsing functions.
 */
export class InvalidFEN {

	/** FEN string that causes the error. */
	fen: string;

	/** Human-readable message describing the error. */
	message: string;

	constructor(fen: string, message: string, ...tokens: any[]) {
		this.fen = fen;
		this.message = buildMessage(message, tokens);
	}

	/**
	 * @ignore
	 */
	toString(): string {
		return toStringImpl('InvalidFEN', this.message);
	}
}


/**
 * Exception thrown by the move notation parsing functions.
 */
export class InvalidNotation {

	/** FEN representation of the position used to interpret the move notation. */
	fen: string;

	/** Move notation that causes the error. */
	notation: string;

	/** Human-readable message describing the error. */
	message: string;

	constructor(fen: string, notation: string, message: string, ...tokens: any[]) {
		this.fen = fen;
		this.notation = notation;
		this.message = buildMessage(message, tokens);
	}

	/**
	 * @ignore
	 */
	toString(): string {
		return toStringImpl('InvalidNotation', this.message);
	}
}


/**
 * Exception thrown by the PGN parsing functions.
 */
export class InvalidPGN {

	/** PGN string that causes the error. */
	pgn: string;

	/** Index (0-based) of the character in the PGN string where the parsing fails (or a negative value if no particular character is related to the error). */
	index: number;

	/** Index (1-based) of the line in the PGN string where the parsing fails (or a negative value if no particular character is related to the error). */
	lineNumber: number;

	/** Human-readable message describing the error. */
	message: string;

	constructor(pgn: string, index: number, lineNumber: number, message: string, ...tokens: any[]) {
		this.pgn = pgn;
		this.index = index;
		this.lineNumber = lineNumber;
		this.message = buildMessage(message, tokens);
	}

	/**
	 * @ignore
	 */
	toString(): string {
		return toStringImpl('InvalidPGN', `[character=${this.index} line=${this.lineNumber}] ${this.message}`);
	}
}


function buildMessage(message: string, tokens: any[]) {
	return message.replace(/{(\d+)}/g, (match, placeholder) => {
		const placeholderIndex = Number(placeholder);
		return placeholderIndex < tokens.length ? tokens[placeholderIndex] : match;
	});
}


function toStringImpl(exceptionName: string, message: string) {
	return exceptionName + ' -> ' + message;
}
