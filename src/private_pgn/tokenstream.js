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


var exception = require('../exception');
var i18n = require('../i18n');


/**
 * @class
 * @classdesc Stream of tokens.
 */
var TokenStream = exports.TokenStream = function(pgnString, initialLocation) {

	// Remove the BOM (byte order mark) if any.
	if(pgnString.codePointAt(0) === 0xFEFF) {
		pgnString = pgnString.substr(1);
	}

	this._text                = pgnString; // what is being parsed
	this._pos                 = 0;         // current position in the string
	this._lineIndex           = 1;         // current line in the string
	this._emptyLineFound      = false;     // whether an empty line has been encountered while parsing the current token
	this._token               = 0;         // current token
	this._tokenValue          = null;      // current token value (if any)
	this._tokenCharacterIndex = -1;        // position of the current token in the string
	this._tokenLineIndex      = -1;        // line of the current token in the string

	if(initialLocation) {
		this._pos = initialLocation.pos;
		this._lineIndex = initialLocation.lineIndex;
	}

	// Space-like matchers
	this._matchSpaces = /[ \f\t\v]+/g;
	this._matchLineBreak = /\r?\n|\r/g;

	// Token matchers
	this._matchHeaderRegular = /\[\s*(\w+)\s+"((?:[^\\"]|\\[\\"])*)"\s*\]/g;
	this._matchHeaderDegenerated = /^\[\s*(\w+)\s+"(.*)"\s*\]$/mg;
	this._matchMove = /(?:[1-9][0-9]*\s*\.(?:\.\.)?\s*)?((?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|(?:[a-h]x?)?[a-h][1-8](?:=?[KQRBNP])?)[+#]?|--)/g;
	this._matchNag = /([!?][!?]?|\+\/?[-=]|[-=]\/?\+|=|inf|~)|\$([1-9][0-9]*)/g;
	this._matchComment = /\{((?:[^{}\\]|\\[{}\\])*)\}/g;
	this._matchBeginVariation = /\(/g;
	this._matchEndVariation = /\)/g;
	this._matchEndOfGame = /1-0|0-1|1\/2-1\/2|\*/g;

	this._matchSpaces.matchedIndex = -1;
	this._matchLineBreak.matchedIndex = -1;
	this._matchHeaderRegular.matchedIndex = -1;
	this._matchHeaderDegenerated.matchedIndex = -1;
	this._matchMove.matchedIndex = -1;
	this._matchNag.matchedIndex = -1;
	this._matchComment.matchedIndex = -1;
	this._matchBeginVariation.matchedIndex = -1;
	this._matchEndVariation.matchedIndex = -1;
	this._matchEndOfGame.matchedIndex = -1;
};


// PGN token types
var TOKEN_HEADER          = TokenStream.HEADER          = 1; // Ex: [White "Kasparov, G."]
var TOKEN_MOVE            = TokenStream.MOVE            = 2; // SAN notation or -- (with an optional move number)
var TOKEN_NAG             = TokenStream.NAG             = 3; // $[1-9][0-9]* or a key from table SPECIAL_NAGS_LOOKUP (!!, +-, etc..)
var TOKEN_COMMENT         = TokenStream.COMMENT         = 4; // {some text}
var TOKEN_BEGIN_VARIATION = TokenStream.BEGIN_VARIATION = 5; // (
var TOKEN_END_VARIATION   = TokenStream.END_VARIATION   = 6; // )
var TOKEN_END_OF_GAME     = TokenStream.END_OF_GAME     = 7; // 1-0, 0-1, 1/2-1/2 or *


/**
 * Try to match the given regular expression at the current position.
 *
 * @param {TokenStream} stream
 * @param {RegExp} regex
 * @returns {boolean}
 */
function testAtPos(stream, regex) {
	if(regex.matchedIndex < stream._pos) {
		regex.lastIndex = stream._pos;
		regex.matched = regex.exec(stream._text);
		regex.matchedIndex = regex.matched === null ? stream._text.length : regex.matched.index;
	}

	if(regex.matchedIndex === stream._pos) {
		stream._pos = regex.lastIndex;
		return true;
	}
	else {
		return false;
	}
}


/**
 * Advance until the first non-blank character.
 *
 * @param {TokenStream} stream
 */
function skipBlanks(stream) {
	var newLineCount = 0;
	while(stream._pos < stream._text.length) {
		if(testAtPos(stream, stream._matchSpaces)) {
			// Nothing to do...
		}
		else if(testAtPos(stream, stream._matchLineBreak)) {
			++newLineCount;
			++stream._lineIndex;
		}
		else {
			break;
		}
	}

	// An empty line was encountered if and only if at least to line breaks were found.
	stream._emptyLineFound = newLineCount >= 2;
}


/**
 * Parse a header value, unescaping special characters.
 *
 * @param {string} rawHeaderValue
 * @returns {string}
 */
function parseHeaderValue(rawHeaderValue) {
	return rawHeaderValue.replace(/\\([\\"])/g, '$1');
}


/**
 * Parse a comment, unescaping special characters, and looking for the `[%key value]` tags.
 *
 * @param {string} rawComment String to parse.
 * @returns {{comment:string, tags:Object}}
 */
function parseCommentValue(rawComment) {
	rawComment = rawComment.replace(/\\([{}\\])/g, '$1');

	// Count the number of line break characters within the comment.
	var lineBreakCount = 0;
	var reLineBreak = /\r?\n|\r/g;
	while(reLineBreak.exec(rawComment)) {
		++lineBreakCount;
	}

	// Find and remove the tags from the raw comment.
	var tags = {};
	var comment = rawComment.replace(/\[%([a-zA-Z0-9]+)\s+([^[\]]+)\]/g, function(match, p1, p2) {
		tags[p1] = p2;
		return ' ';
	});

	// Trim the comment and collapse sequences of space characters into 1 character only.
	comment = comment.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
	if(comment === '') {
		comment = undefined;
	}

	// Return the result
	return { comment:comment, tags:tags, lineBreakCount:lineBreakCount };
}


// Conversion table NAG -> numeric code
var SPECIAL_NAGS_LOOKUP = {
	'!!' :  3,             // very good move
	'!'  :  1,             // good move
	'!?' :  5,             // interesting move
	'?!' :  6,             // questionable move
	'?'  :  2,             // bad move
	'??' :  4,             // very bad move
	'+-' : 18,             // White has a decisive advantage
	'+/-': 16,             // White has a moderate advantage
	'+/=': 14, '+=' : 14,  // White has a slight advantage
	'='  : 10,             // equal position
	'~'  : 13, 'inf': 13,  // unclear position
	'=/+': 15, '=+' : 15,  // Black has a slight advantage
	'-/+': 17,             // Black has a moderate advantage
	'-+' : 19              // Black has a decisive advantage
};


/**
 * Try to consume 1 token.
 *
 * @return {boolean} `true` if a token could have been read, `false` if the end of the text has been reached.
 * @throws {module:exception.InvalidPGN} If the text cannot be interpreted as a valid token.
 */
TokenStream.prototype.consumeToken = function() {

	// Consume blank (i.e. meaning-less) characters
	skipBlanks(this);
	if(this._pos >= this._text.length) {
		this._tokenCharacterIndex = this._text.length;
		this._tokenLineIndex = this._lineIndex;
		return false;
	}

	// Remaining part of the string
	this._tokenCharacterIndex = this._pos;
	this._tokenLineIndex = this._lineIndex;

	// Match a game header (ex: [White "Kasparov, G."])
	if(testAtPos(this, this._matchHeaderRegular)) {
		this._token      = TOKEN_HEADER;
		this._tokenValue = { key: this._matchHeaderRegular.matched[1], value: parseHeaderValue(this._matchHeaderRegular.matched[2]) };
	}
	else if(testAtPos(this, this._matchHeaderDegenerated)) {
		this._token      = TOKEN_HEADER;
		this._tokenValue = { key: this._matchHeaderDegenerated.matched[1], value: this._matchHeaderDegenerated.matched[2] };
	}

	// Match a move or a null-move
	else if(testAtPos(this, this._matchMove)) {
		this._token      = TOKEN_MOVE;
		this._tokenValue = this._matchMove.matched[1];
	}

	// Match a NAG
	else if(testAtPos(this, this._matchNag)) {
		this._token      = TOKEN_NAG;
		this._tokenValue = this._matchNag.matched[2] === undefined ? SPECIAL_NAGS_LOOKUP[this._matchNag.matched[1]] :
			parseInt(this._matchNag.matched[2], 10);
	}

	// Match a comment
	else if(testAtPos(this, this._matchComment)) {
		this._token      = TOKEN_COMMENT;
		this._tokenValue = parseCommentValue(this._matchComment.matched[1]);
		this._lineIndex += this._tokenValue.lineBreakCount;
	}

	// Match the beginning of a variation
	else if(testAtPos(this, this._matchBeginVariation)) {
		this._token      = TOKEN_BEGIN_VARIATION;
		this._tokenValue = null;
	}

	// Match the end of a variation
	else if(testAtPos(this, this._matchEndVariation)) {
		this._token      = TOKEN_END_VARIATION;
		this._tokenValue = null;
	}

	// Match a end-of-game marker
	else if(testAtPos(this, this._matchEndOfGame)) {
		this._token      = TOKEN_END_OF_GAME;
		this._tokenValue = this._matchEndOfGame.matched[0];
	}

	// Otherwise, the string is badly formatted with respect to the PGN syntax
	else {
		throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
	}

	return true;
};


/**
 * PGN string being parsed.
 */
TokenStream.prototype.text = function() {
	return this._text;
};


/**
 * Current location within the stream.
 */
TokenStream.prototype.currentLocation = function() {
	return { pos: this._pos, lineIndex: this._lineIndex };
};


/**
 * Whether an empty line has been encountered just before the current token.
 */
TokenStream.prototype.emptyLineFound = function() {
	return this._emptyLineFound;
};


/**
 * Current token.
 */
TokenStream.prototype.token = function() {
	return this._token;
};


/**
 * Value associated to the current token, if any.
 */
TokenStream.prototype.tokenValue = function() {
	return this._tokenValue;
};


/**
 * Line index of the current token.
 */
TokenStream.prototype.tokenLineIndex = function() {
	return this._tokenLineIndex;
};


/**
 * Character index of the current token.
 */
TokenStream.prototype.tokenCharacterIndex = function() {
	return this._tokenCharacterIndex;
};
