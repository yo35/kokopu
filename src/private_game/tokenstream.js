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
var common = require('./common');


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
	this._matchLineBreak.needIncrementLineIndex = true;
	this._matchFastAdvance = /[^ \f\t\v\r\n"{][^ \f\t\v\r\n"{10*]*/g;

	// Token matchers
	this._matchBeginHeader = /\[/g;
	this._matchEndHeader = /\]/g;
	this._matchHeaderId = /(\w+)/g;
	this._matchEnterHeaderValue = /"/g;
	this._matchMoveNumber = /[1-9][0-9]*\.(?:\.\.)?/g;
	this._matchMove = /(?:O-O(?:-O)?|0-0(?:-0)?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|(?:[a-h]x?)?[a-h][1-8](?:=?[KQRBNP])?)[+#]?|--/g;
	this._matchNag = /([!?][!?]?|\+\/?[-=]|[-=]\/?\+|=|inf|~)|\$([1-9][0-9]*)/g;
	this._matchEnterComment = /\{/g;
	this._matchBeginVariation = /\(/g;
	this._matchEndVariation = /\)/g;
	this._matchEndOfGame = /1-0|0-1|1\/2-1\/2|\*/g;

	// Special modes
	this._headerValueMode = /((?:[^\\"\f\t\v\r\n]|\\[^\f\t\v\r\n])*)"/g;
	this._headerValueDegradedMode = /[^\r\n]*/g;
	this._commentMode = /((?:[^\\}]|\\.)*)\}/g;
	this._commentMode.needIncrementLineIndex = true;
};


// PGN token types
var TOKEN_BEGIN_HEADER    = TokenStream.BEGIN_HEADER    =  1; // [
var TOKEN_END_HEADER      = TokenStream.END_HEADER      =  2; // ]
var TOKEN_HEADER_ID       = TokenStream.HEADER_ID       =  3; // Identifier of a header (e.g. `White` in header `[White "Kasparov, G."]`)
var TOKEN_HEADER_VALUE    = TokenStream.HEADER_VALUE    =  4; // Value of a header (e.g. `Kasparov, G.` in header `[White "Kasparov, G."]`)
var TOKEN_MOVE_NUMBER     = TokenStream.MOVE_NUMBER     =  5; // 42. or 23...
var TOKEN_MOVE            = TokenStream.MOVE            =  6; // SAN notation
var TOKEN_NAG             = TokenStream.NAG             =  7; // $[1-9][0-9]* or a key from table SPECIAL_NAGS_LOOKUP (!!, +-, etc..)
var TOKEN_COMMENT         = TokenStream.COMMENT         =  8; // {some text}
var TOKEN_BEGIN_VARIATION = TokenStream.BEGIN_VARIATION =  9; // (
var TOKEN_END_VARIATION   = TokenStream.END_VARIATION   = 10; // )
var TOKEN_END_OF_GAME     = TokenStream.END_OF_GAME     = 11; // 1-0, 0-1, 1/2-1/2 or *

// Movetext-related tokens are found within this interval.
var FIRST_MOVE_TEXT_TOKEN = TOKEN_MOVE_NUMBER;
var LAST_MOVE_TEXT_TOKEN = TOKEN_END_OF_GAME;


/**
 * Try to match the given regular expression at the current position, and increment the stream cursor (`stream._pos`) and the line counter (`stream._lineIndex`) in case of a match.
 *
 * @param {TokenStream} stream
 * @param {RegExp} regex
 * @returns {boolean}
 */
function testAtPos(stream, regex) {
	if(regex.matchedIndex === undefined || regex.matchedIndex < stream._pos) {
		regex.lastIndex = stream._pos;
		regex.matched = regex.exec(stream._text);
		regex.matchedIndex = regex.matched === null ? stream._text.length : regex.matched.index;
	}

	if(regex.matchedIndex === stream._pos) {
		stream._pos = regex.lastIndex;
		if(regex.needIncrementLineIndex) {
			var reLineBreak = /\r?\n|\r/g;
			while(reLineBreak.exec(regex.matched[0])) {
				++stream._lineIndex;
			}
		}
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
	return common.trimAndCollapseSpaces(rawHeaderValue.replace(/\\([\\"])/g, '$1'));
}


/**
 * Parse a comment, unescaping special characters, and looking for the `[%key value]` tags.
 *
 * @param {string} rawComment String to parse.
 * @returns {{comment:string, tags:Object}}
 */
function parseCommentValue(rawComment) {
	rawComment = rawComment.replace(/\\([\\}])/g, '$1');

	// Find and remove the tags from the raw comment.
	var tags = {};
	var comment = rawComment.replace(/\[%(\w+)\s([^[\]]*)\]/g, function(match, p1, p2) {
		p2 = common.trimAndCollapseSpaces(p2);
		if (p2 !== '') {
			tags[p1] = p2;
		}
		return ' ';
	});

	// Trim the comment and collapse sequences of space characters into 1 character only.
	comment = common.trimAndCollapseSpaces(comment);
	if(comment === '') {
		comment = undefined;
	}

	// Return the result
	return { comment:comment, tags:tags };
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
 * @returns {boolean} `true` if a token could have been read, `false` if the end of the text has been reached.
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

	// Save the location of the token.
	this._tokenCharacterIndex = this._pos;
	this._tokenLineIndex = this._lineIndex;

	// Match a move number
	if(testAtPos(this, this._matchMoveNumber)) {
		this._token      = TOKEN_MOVE_NUMBER;
		this._tokenValue = null;
	}

	// Match a move or a null-move
	else if(testAtPos(this, this._matchMove)) {
		this._token      = TOKEN_MOVE;
		this._tokenValue = this._matchMove.matched[0];
	}

	// Match a NAG
	else if(testAtPos(this, this._matchNag)) {
		this._token      = TOKEN_NAG;
		this._tokenValue = this._matchNag.matched[2] === undefined ? SPECIAL_NAGS_LOOKUP[this._matchNag.matched[1]] :
			parseInt(this._matchNag.matched[2], 10);
	}

	// Match a comment
	else if(testAtPos(this, this._matchEnterComment)) {
		if(!testAtPos(this, this._commentMode)) {
			throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
		}
		this._token      = TOKEN_COMMENT;
		this._tokenValue = parseCommentValue(this._commentMode.matched[1]);
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

	// Match the beginning of a game header
	else if(testAtPos(this, this._matchBeginHeader)) {
		this._token      = TOKEN_BEGIN_HEADER;
		this._tokenValue = null;
	}

	// Match the end of a game header
	else if(testAtPos(this, this._matchEndHeader)) {
		this._token      = TOKEN_END_HEADER;
		this._tokenValue = null;
	}

	// Match the ID of a game header
	else if(testAtPos(this, this._matchHeaderId)) {
		this._token      = TOKEN_HEADER_ID;
		this._tokenValue = this._matchHeaderId.matched[1];
	}

	// Match the value of a game header
	else if(testAtPos(this, this._matchEnterHeaderValue)) {
		if(!testAtPos(this, this._headerValueMode)) {
			throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
		}
		this._token      = TOKEN_HEADER_VALUE;
		this._tokenValue = parseHeaderValue(this._headerValueMode.matched[1]);
	}

	// Otherwise, the string is badly formatted with respect to the PGN syntax
	else {
		throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
	}

	return true;
};


/**
 * Try to skip all the tokens until a END_OF_GAME token or the end of the file is encountered.
 *
 * @returns {boolean} `true` if any token have been found, `false` if the end of the file has been reached without finding any token.
 * @throws {module:exception.InvalidPGN} If the text cannot be interpreted as a valid stream of tokens.
 */
TokenStream.prototype.skipGame = function() {
	var atLeastOneTokenFound = false;
	while(true) {

		// Consume blank (i.e. meaning-less) characters
		skipBlanks(this);
		if(this._pos >= this._text.length) {
			this._tokenCharacterIndex = this._text.length;
			this._tokenLineIndex = this._lineIndex;
			return atLeastOneTokenFound;
		}

		// Save the location of the token.
		this._tokenCharacterIndex = this._pos;
		this._tokenLineIndex = this._lineIndex;
		atLeastOneTokenFound = true;

		// Skip comments.
		if(testAtPos(this, this._matchEnterComment)) {
			if(!testAtPos(this, this._commentMode)) {
				throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
			}
		}

		// Skip header values.
		else if(testAtPos(this, this._matchEnterHeaderValue)) {
			if(!testAtPos(this, this._headerValueMode) && !testAtPos(this, this._headerValueDegradedMode)) {
				throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
			}
		}

		// Match a end-of-game marker.
		else if(testAtPos(this, this._matchEndOfGame)) {
			this._token      = TOKEN_END_OF_GAME;
			this._tokenValue = this._matchEndOfGame.matched[0];
			return true;
		}

		// Skip everything else until the next space or comment/header-value beginning.
		else if(!testAtPos(this, this._matchFastAdvance)) {
			throw new exception.InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
		}
	}
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


/**
 * Wether the current token is a token of the move-text section.
 */
TokenStream.prototype.isMoveTextSection = function() {
	return this._token >= FIRST_MOVE_TEXT_TOKEN && this._token <= LAST_MOVE_TEXT_TOKEN;
};
