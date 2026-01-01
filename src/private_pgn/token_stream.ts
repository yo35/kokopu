/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2026  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    Kokopu is free software: you can redistribute it and/or                 *
 *    modify it under the terms of the GNU Lesser General Public License      *
 *    as published by the Free Software Foundation, either version 3 of       *
 *    the License, or (at your option) any later version.                     *
 *                                                                            *
 *    Kokopu is distributed in the hope that it will be useful,               *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the            *
 *    GNU Lesser General Public License for more details.                     *
 *                                                                            *
 *    You should have received a copy of the GNU Lesser General               *
 *    Public License along with this program. If not, see                     *
 *    <http://www.gnu.org/licenses/>.                                         *
 *                                                                            *
 * -------------------------------------------------------------------------- */


import { InvalidPGN } from '../exception';
import { i18n } from '../i18n';
import { trimAndCollapseSpaces } from '../private_game/common';


interface RegExpWrapper extends RegExp {
    needIncrementLineIndex: boolean,
    matchedIndex: number,
    matched: RegExpExecArray | null,
}


function regExpWrapper(re: RegExp, needIncrementLineIndex?: boolean) {
    const result = re as RegExpWrapper;
    result.needIncrementLineIndex = needIncrementLineIndex !== undefined && needIncrementLineIndex;
    result.matchedIndex = -1;
    result.matched = null;
    return result;
}


/**
 * Types of tokens that could be encountered in a PGN.
 */
export const enum TokenType {
    /* eslint-disable @stylistic/no-multi-spaces */
    INVALID         =  0,
    BEGIN_HEADER    =  1, // [
    END_HEADER      =  2, // ]
    HEADER_ID       =  3, // Identifier of a header (e.g. `White` in header `[White "Kasparov, G."]`)
    HEADER_VALUE    =  4, // Value of a header (e.g. `Kasparov, G.` in header `[White "Kasparov, G."]`)
    MOVE_NUMBER     =  5, // 42. or 23...
    MOVE            =  6, // SAN notation
    NAG             =  7, // $[1-9][0-9]* or a key from table SPECIAL_NAGS_LOOKUP (!!, +-, etc..)
    COMMENT         =  8, // {some text}
    BEGIN_VARIATION =  9, // (
    END_VARIATION   = 10, // )
    END_OF_GAME     = 11, // 1-0, 0-1, 1/2-1/2 or *
    /* eslint-enable */
}


// Movetext-related tokens are found within this interval.
const FIRST_MOVE_TEXT_TOKEN = TokenType.MOVE_NUMBER;
const LAST_MOVE_TEXT_TOKEN = TokenType.END_OF_GAME;


// Conversion table NAG -> numeric code
const SPECIAL_NAGS_LOOKUP = new Map<string, number>();
/* eslint-disable @stylistic/no-multi-spaces, @stylistic/comma-spacing */
SPECIAL_NAGS_LOOKUP.set('!!' ,   3); // very good move
SPECIAL_NAGS_LOOKUP.set('!'  ,   1); // good move
SPECIAL_NAGS_LOOKUP.set('!?' ,   5); // interesting move
SPECIAL_NAGS_LOOKUP.set('?!' ,   6); // questionable move
SPECIAL_NAGS_LOOKUP.set('?'  ,   2); // bad move
SPECIAL_NAGS_LOOKUP.set('??' ,   4); // very bad move
SPECIAL_NAGS_LOOKUP.set('+-' ,  18); // White has a decisive advantage
SPECIAL_NAGS_LOOKUP.set('+/-',  16); // White has a moderate advantage
SPECIAL_NAGS_LOOKUP.set('+/=',  14); // White has a slight advantage
SPECIAL_NAGS_LOOKUP.set('+=' ,  14); // (same)
SPECIAL_NAGS_LOOKUP.set('='  ,  10); // equal position
SPECIAL_NAGS_LOOKUP.set('~'  ,  13); // unclear position
SPECIAL_NAGS_LOOKUP.set('inf',  13); // (same)
SPECIAL_NAGS_LOOKUP.set('=/+',  15); // Black has a slight advantage
SPECIAL_NAGS_LOOKUP.set('=+' ,  15); // (same)
SPECIAL_NAGS_LOOKUP.set('-/+',  17); // Black has a moderate advantage
SPECIAL_NAGS_LOOKUP.set('-+' ,  19); // Black has a decisive advantage
SPECIAL_NAGS_LOOKUP.set('RR' , 145); // Editorial comment
SPECIAL_NAGS_LOOKUP.set('N'  , 146); // Novelty
/* eslint-enable */


/**
 * Location within a PGN text.
 */
export interface StreamPosition {
    pos: number,
    lineIndex: number,
}


/**
 * Stream of PGN tokens.
 */
export class TokenStream {

    /** What is being parsed. */
    private _text: string;

    /** Current position in the string. */
    private _pos = 0;

    /** Current line index in the string. */
    private _lineIndex = 1;

    /** Current token. */
    private _token = TokenType.INVALID;

    /** Current token value (if any). */
    private _tokenValue: unknown = null;

    /** Position of the current token in the string. */
    private _tokenCharacterIndex = -1;

    /** Line index of the current token in the string. */
    private _tokenLineIndex = -1;

    /** Whether an empty line has been encountered before the current token. */
    private _emptyLineBeforeToken = false;

    /** Whether an empty line will be encountered after the current token. */
    private _emptyLineAfterToken = false;

    // Space-like matchers
    private _matchSpaces = regExpWrapper(/[ \f\t\v]+/g);
    private _matchLineBreak = regExpWrapper(/\r?\n|\r/g, true);
    private _matchFastAdvance = regExpWrapper(/[^ \f\t\v\r\n"{][^ \f\t\v\r\n"{10*]*/g);

    // Token matchers
    private _matchBeginHeader = regExpWrapper(/\[/g);
    private _matchEndHeader = regExpWrapper(/\]/g);
    private _matchHeaderId = regExpWrapper(/(\w+)/g);
    private _matchEnterHeaderValue = regExpWrapper(/"/g);
    private _matchMoveNumber = regExpWrapper(/[0-9]+\.(?:\.\.)?/g);
    private _matchMove = regExpWrapper(/(?:O-O(?:-O)?|0-0(?:-0)?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|(?:[a-h]x?)?[a-h][1-8](?:=?[KQRBNP])?)[+#]?|--/g);
    private _matchNag = regExpWrapper(/([!?][!?]?|\+\/?[-=]|[-=]\/?\+|=|inf|~|RR|N)|\$([1-9][0-9]*)/g);
    private _matchEnterComment = regExpWrapper(/\{/g);
    private _matchBeginVariation = regExpWrapper(/\(/g);
    private _matchEndVariation = regExpWrapper(/\)/g);
    private _matchEndOfGame = regExpWrapper(/1-0|0-1|1\/2-1\/2|\*/g);

    // Special modes
    private _headerValueMode = regExpWrapper(/((?:[^\\"\f\t\v\r\n]|\\[^\f\t\v\r\n])*)"/g);
    private _headerValueDegradedMode = regExpWrapper(/[^\r\n]*/g);
    private _commentMode = regExpWrapper(/((?:[^\\}]|\\(?:.|[\r\n]))*)\}/g, true);


    constructor(text: string, initialLocation?: StreamPosition) {

        // Remove the BOM (byte order mark) if any.
        if (text.codePointAt(0) === 0xFEFF) {
            text = text.substring(1);
        }
        this._text = text;

        // Skip the beginning of the text if requested.
        if (initialLocation !== undefined) {
            this._pos = initialLocation.pos;
            this._lineIndex = initialLocation.lineIndex;
        }
    }


    /**
     * PGN string being parsed.
     */
    text() {
        return this._text;
    }


    /**
     * Current location within the stream.
     */
    currentLocation() {
        return { pos: this._pos, lineIndex: this._lineIndex };
    }


    /**
     * Whether there is an empty line just before the current token. WARNING: valid only after a call to `consumeToken()`.
     */
    emptyLineBeforeToken() {
        return this._emptyLineBeforeToken;
    }


    /**
     * Whether there is an empty line just after the current token. WARNING: valid only after a call to `consumeToken()`.
     */
    emptyLineAfterToken() {
        return this._emptyLineAfterToken;
    }


    /**
     * Current token type. WARNING: valid only after a call to `consumeToken()`.
     */
    token() {
        return this._token;
    }


    /**
     * Value associated to the current token, if any. WARNING: valid only after a call to `consumeToken()`.
     */
    tokenValue<T>(): T {
        return this._tokenValue as T;
    }


    /**
     * Character index of the current token. WARNING: valid only after a call to `consumeToken()`.
     */
    tokenCharacterIndex() {
        return this._tokenCharacterIndex;
    }


    /**
     * Line index of the current token. WARNING: valid only after a call to `consumeToken()`.
     */
    tokenLineIndex() {
        return this._tokenLineIndex;
    }


    /**
     * Wether the current token is a token of the move-text section. WARNING: valid only after a call to `consumeToken()`.
     */
    isMoveTextSection() {
        return this._token >= FIRST_MOVE_TEXT_TOKEN && this._token <= LAST_MOVE_TEXT_TOKEN;
    }


    /**
     * Try to consume 1 token.
     *
     * @returns `true` if a token could have been read, `false` if the end of the text has been reached.
     * @throws {@link exception.InvalidPGN} if the text cannot be interpreted as a valid token.
     */
    consumeToken() {

        // Consume blank (i.e. meaning-less) characters
        this._emptyLineBeforeToken = this._token === TokenType.INVALID || this._token === TokenType.END_OF_GAME ? this.skipBlanks() : this._emptyLineAfterToken;
        if (this._pos >= this._text.length) {
            this._tokenCharacterIndex = this._text.length;
            this._tokenLineIndex = this._lineIndex;
            return false;
        }

        // Save the location of the token.
        this._tokenCharacterIndex = this._pos;
        this._tokenLineIndex = this._lineIndex;

        // Match a move number
        if (this.testAtPos(this._matchMoveNumber)) {
            this._token = TokenType.MOVE_NUMBER;
            this._tokenValue = null;
        }

        // Match a move or a null-move
        else if (this.testAtPos(this._matchMove)) {
            this._token = TokenType.MOVE;
            this._tokenValue = this._matchMove.matched![0];
        }

        // Match a NAG
        else if (this.testAtPos(this._matchNag)) {
            this._token = TokenType.NAG;
            this._tokenValue = this._matchNag.matched![2] === undefined ?
                SPECIAL_NAGS_LOOKUP.get(this._matchNag.matched![1]) :
                parseInt(this._matchNag.matched![2], 10);
        }

        // Match a comment
        else if (this.testAtPos(this._matchEnterComment)) {
            if (!this.testAtPos(this._commentMode)) {
                throw new InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
            }
            this._token = TokenType.COMMENT;
            this._tokenValue = parseCommentValue(this._commentMode.matched![1]);
        }

        // Match the beginning of a variation
        else if (this.testAtPos(this._matchBeginVariation)) {
            this._token = TokenType.BEGIN_VARIATION;
            this._tokenValue = null;
        }

        // Match the end of a variation
        else if (this.testAtPos(this._matchEndVariation)) {
            this._token = TokenType.END_VARIATION;
            this._tokenValue = null;
        }

        // Match a end-of-game marker
        else if (this.testAtPos(this._matchEndOfGame)) {
            this._token = TokenType.END_OF_GAME;
            this._tokenValue = this._matchEndOfGame.matched![0];
        }

        // Match the beginning of a game header
        else if (this.testAtPos(this._matchBeginHeader)) {
            this._token = TokenType.BEGIN_HEADER;
            this._tokenValue = null;
        }

        // Match the end of a game header
        else if (this.testAtPos(this._matchEndHeader)) {
            this._token = TokenType.END_HEADER;
            this._tokenValue = null;
        }

        // Match the ID of a game header
        else if (this.testAtPos(this._matchHeaderId)) {
            this._token = TokenType.HEADER_ID;
            this._tokenValue = this._matchHeaderId.matched![1];
        }

        // Match the value of a game header
        else if (this.testAtPos(this._matchEnterHeaderValue)) {
            if (!this.testAtPos(this._headerValueMode)) {
                throw new InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
            }
            this._token = TokenType.HEADER_VALUE;
            this._tokenValue = parseHeaderValue(this._headerValueMode.matched![1]);
        }

        // Otherwise, the string is badly formatted with respect to the PGN syntax
        else {
            throw new InvalidPGN(this._text, this._pos, this._lineIndex, i18n.INVALID_PGN_TOKEN);
        }

        this._emptyLineAfterToken = this._token === TokenType.END_OF_GAME ? false : this.skipBlanks();
        return true;
    }


    /**
     * Try to skip all the tokens until a END_OF_GAME token or the end of the file is encountered.
     *
     * @returns `true` if any token have been found, `false` if the end of the file has been reached without finding any token.
     */
    skipGame() {
        let atLeastOneTokenFound = false;
        this._token = TokenType.INVALID;
        while (true) {

            // Consume blank (i.e. meaning-less) characters
            this.skipBlanks();
            if (this._pos >= this._text.length) {
                return atLeastOneTokenFound;
            }
            atLeastOneTokenFound = true;

            // Skip comments.
            if (this.testAtPos(this._matchEnterComment)) {
                if (!this.testAtPos(this._commentMode)) {
                    this._pos = this._text.length;
                    return true;
                }
            }

            // Skip header values.
            else if (this.testAtPos(this._matchEnterHeaderValue)) {
                if (!this.testAtPos(this._headerValueMode)) {
                    this.testAtPos(this._headerValueDegradedMode); // Always true as `_headerValueDegradedMode` matches the empty string.
                }
            }

            // Match a end-of-game marker.
            else if (this.testAtPos(this._matchEndOfGame)) {
                return true;
            }

            // Skip everything else until the next space or comment/header-value beginning.
            else {
                this.testAtPos(this._matchFastAdvance); // Always true given the other regexes `_matchEnterComment` and `_matchEnterHeaderValue`.
            }
        }
    }


    /**
     * Advance until the first non-blank character.
     *
     * @returns `true` if an empty line has been encountered.
     */
    private skipBlanks() {
        let newLineCount = 0;
        while (this._pos < this._text.length) {
            if (this.testAtPos(this._matchSpaces)) {
                // Nothing to do...
            }
            else if (this.testAtPos(this._matchLineBreak)) {
                ++newLineCount;
            }
            else {
                break;
            }
        }

        // An empty line was encountered if and only if at least 2 line breaks were found.
        return newLineCount >= 2;
    }


    /**
     * Try to match the given regular expression at the current position, and increment the stream cursor `this._pos`
     * and the line counter `this._lineIndex` in case of a match.
     */
    private testAtPos(re: RegExpWrapper) {
        if (re.matchedIndex < this._pos) {
            re.lastIndex = this._pos;
            re.matched = re.exec(this._text);
            re.matchedIndex = re.matched === null ? this._text.length : re.matched.index;
        }

        if (re.matchedIndex === this._pos) {
            this._pos = re.lastIndex;
            if (re.needIncrementLineIndex) {
                const reLineBreak = /\r?\n|\r/g;
                while (reLineBreak.exec(re.matched![0])) {
                    ++this._lineIndex;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }

}


export interface TokenCommentData {
    comment: string | undefined,
    tags: Map<string, string>,
}


/**
 * Parse a header value, unescaping special characters.
 */
function parseHeaderValue(rawHeaderValue: string): string {
    return trimAndCollapseSpaces(rawHeaderValue.replace(/\\([\\"])/g, '$1'));
}


/**
 * Parse a comment, unescaping special characters, and looking for the `[%key value]` tags.
 */
function parseCommentValue(rawComment: string): TokenCommentData {
    rawComment = rawComment.replace(/\\([\\}])/g, '$1');

    // Find and remove the tags from the raw comment.
    const tags = new Map();
    let comment: string | undefined = rawComment.replace(/\[%(\w+)\s([^[\]]*)\]/g, (_, p1, p2) => {
        p2 = trimAndCollapseSpaces(p2);
        if (p2 !== '') {
            tags.set(p1, p2);
        }
        return ' ';
    });

    // Trim the comment and collapse sequences of space characters into 1 character only.
    comment = trimAndCollapseSpaces(comment);
    if (comment === '') {
        comment = undefined;
    }

    // Return the result
    return { comment: comment, tags: tags };
}
