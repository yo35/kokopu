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
var exception = require('./exception');
var i18n = require('./i18n');

var Position = require('./position').Position;



// -----------------------------------------------------------------------------
// Game
// -----------------------------------------------------------------------------

/**
 * Chess game, with some headers, a main variation, and a result.
 */
var Game = exports.Game = function() {
	this._playerName  = [undefined, undefined];
	this._playerElo   = [undefined, undefined];
	this._playerTitle = [undefined, undefined];
	this._event     = undefined;
	this._round     = undefined;
	this._date      = undefined;
	this._site      = undefined;
	this._annotator = undefined;
	this._result    = bt.LINE;

	this._initialPosition = new Position();
	this._fullMoveNumber = 1;
	this._mainVariation = new Variation(this, true);
};


/**
 * Get/set the player name.
 */
Game.prototype.playerName = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerName()'); }
	if(arguments.length === 1) { return this._playerName[color]; }
	else { this._playerName[color] = value; }
};


/**
 * Get/set the player elo.
 */
Game.prototype.playerElo = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerElo()'); }
	if(arguments.length === 1) { return this._playerElo[color]; }
	else { this._playerElo[color] = value; }
};


/**
 * Get/set the player title.
 */
Game.prototype.playerTitle = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerTitle()'); }
	if(arguments.length === 1) { return this._playerTitle[color]; }
	else { this._playerTitle[color] = value; }
};


/**
 * Get/set the event.
 */
Game.prototype.event = function(value) {
	if(arguments.length === 0) { return this._event; }
	else { this._event = value; }
};


/**
 * Get/set the round.
 */
Game.prototype.round = function(value) {
	if(arguments.length === 0) { return this._round; }
	else { this._round = value; }
};


/**
 * Get/set the date of the game.
 */
Game.prototype.date = function(value) {
	if(arguments.length === 0) {
		return this._date;
	}
	else if(typeof value === 'undefined' || value === null) {
		this.date = undefined;
	}
	else if(value instanceof Date) {
		this.date = value;
	}
	else if(typeof value === 'object' && typeof value.year === 'number' && typeof value.month === 'number') {
		this.date = { year: value.year, month: value.month };
	}
	else {
		throw new exception.IllegalArgument('Game#date()');
	}
};


/**
 * Get/set where the game takes place.
 */
Game.prototype.site = function(value) {
	if(arguments.length === 0) { return this._site; }
	else { this._site = value; }
};


/**
 * Get/set the annotator.
 */
Game.prototype.annotator = function(value) {
	if(arguments.length === 0) { return this._annotator; }
	else { this._annotator = value; }
};


/**
 * Get/set the result of the game.
 */
Game.prototype.result = function(value) {
	if(arguments.length === 0) {
		return bt.resultToString(this._result);
	}
	else {
		var result = bt.resultFromString(value);
		if(result < 0) {
			throw new exception.IllegalArgument('Game#result()');
		}
		this._result = result;
	}
};


/**
 * Get/set the initial position of the game. WARNING: the setter resets the main variation.
 *
 * @param {Position} initialPosition (SETTER only)
 * @param {number?} fullMoveNumber (SETTER only)
 * @returns {Position} (GETTER only)
 */
Game.prototype.initialPosition = function(initialPosition, fullMoveNumber) {
	if(arguments.length === 0) {
		return this._initialPosition;
	}
	else {
		if(!(initialPosition instanceof Position)) {
			throw new exception.IllegalArgument('Game#initialPosition()');
		}
		if(typeof fullMoveNumber === 'undefined') {
			fullMoveNumber = 1;
		}
		else if(typeof fullMoveNumber !== 'number') {
			throw new exception.IllegalArgument('Game#initialPosition()');
		}
		this._initialPosition = initialPosition;
		this._fullMoveNumber = fullMoveNumber;
		this._mainVariation = new Variation(this, true);
	}
};


/**
 * Main variation.
 *
 * @returns {Variation}
 */
Game.prototype.mainVariation = function() {
	return this._mainVariation;
};



// -----------------------------------------------------------------------------
// Node
// -----------------------------------------------------------------------------

/**
 * Represent one move in the tree structure formed by a chess game with multiple variations.
 *
 * @param {Variation} parentVariation
 * @param {Node?} previous
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @throws {InvalidNotation} If the move notation cannot be parsed.
 */
function Node(parentVariation, previous, move) {

	this._parentVariation = parentVariation;  // Variation to which the current node belongs (always a `Variation` object).
	this._previous = previous; // Previous node (always a `Node` object if defined).
	this._next = undefined; // Next node (always a `Node` object if defined).
	this._position = new Position(typeof previous === 'undefined' ? parentVariation.initialPosition() : previous.position());

	// Null move.
	if(move === '--') {
		this._notation = '--';
		if(!this._position.playNullMove()) {
			throw new exception.InvalidNotation(this._position, '--', i18n.ILLEGAL_NULL_MOVE);
		}
	}

	// Regular move.
	else {
		var moveDescriptor = this._position.notation(move);
		this._notation = this._position.notation(moveDescriptor);
		this._position.play(moveDescriptor);
	}

	// Full-move number
	if(typeof previous === 'undefined') {
		this._fullMoveNumber = parentVariation.initialFullMoveNumber();
	}
	else {
		this._fullMoveNumber = previous._fullMoveNumber + (previous.position().turn() === 'w' ? 1 : 0);
	}

	// Variations that could be played instead of the current move.
	this._variations = [];

	// Annotations and comments associated to the current move.
	this._nags = {};
	this._tags = {};
	this._comment = undefined;
	this._isLongComment = false;
}


/**
 * SAN representation of the move associated to the current node.
 *
 * @returns {string}
 */
Node.prototype.notation = function() {
	return this._notation;
};


/**
 * Chess position before the current move.
 *
 * @returns {Position}
 */
Node.prototype.positionBefore = function() {
	return this._parent.position();
};


/**
 * Chess position obtained after the current move.
 *
 * @returns {Position}
 */
Node.prototype.position = function() {
	return this._position;
};


/**
 * Full-move number. It starts at 1, and is incremented after each black move.
 *
 * @returns {number}
 */
Node.prototype.fullMoveNumber = function() {
	return this._fullMoveNumber;
};


/**
 * Color the side corresponding to the current move.
 *
 * @returns {string} Either `'w'` or `'b'`.
 */
Node.prototype.moveColor = function() {
	return this._parent.position().turn();
};


/**
 * Next move within the same variation.
 *
 * @returns {Node?} `undefined` if the current move is the last move of the variation.
 */
Node.prototype.next = function() {
	return this._next;
};


/**
 * Return the variations that can be followed instead of the current move.
 *
 * @returns {Variation[]}
 */
Node.prototype.variations = function() {
	return this._variations.slice(0);
};


/**
 * Return the NAGs associated to the current move.
 *
 * @returns {number[]}
 */
Node.prototype.nags = function() {
	var res = [];
	for(var key in this._nags) {
		if(this._nags[key]) {
			res.push(key);
		}
	}
	return res;
};


/**
 * Check whether the current has the given NAG or not.
 *
 * @param {number} nag
 * @returns {boolean}
 */
Node.prototype.hasNag = function(nag) {
	return !!this._nags[nag];
};


/**
 * Add the given NAG to the current move.
 *
 * @param {number} nag
 */
Node.prototype.addNag = function(nag) {
	this._nags[nag] = true;
};


/**
 * Remove the given NAG from the current move.
 *
 * @param {number} nag
 */
Node.prototype.removeNag = function(nag) {
	delete this._nags[nag];
};


/**
 * Return the keys of the tags associated to the current move.
 *
 * @returns {string[]}
 */
Node.prototype.tags = function() {
	var res = [];
	for(var key in this._tags) {
		if(typeof this._tags[key] !== 'undefined') {
			res.push(key);
		}
	}
	return res;
};


/**
 * Get/set the value that is defined for the tag corresponding to the given key on the current move.
 *
 * @param {string} key
 * @param {string} value (SETTER only)
 * @returns {string?} `undefined` if no value is defined for this tag on the current move. (GETTER only)
 */
Node.prototype.tag = function(key, value) {
	if(arguments.length === 1) {
		return this._tags[key];
	}
	else {
		this._tags[key] = value;
	}
};


/**
 * Get/set the text comment associated to the current move.
 *
 * @param {string} value (SETTER only)
 * @param {boolean?} isLongComment (SETTER only)
 * @returns {string?} `undefined` if no comment is defined for the move. (GETTER only)
 */
Node.prototype.comment = function(value, isLongComment) {
	if(arguments.length === 0) {
		return this._comment;
	}
	else {
		this._comment = value;
		this._isLongComment = isLongComment;
	}
};


/**
 * Whether the text comment associated to the current move is long or short.
 *
 * @returns {boolean}
 */
Node.prototype.isLongComment = function() {
	return this._isLongComment && this._parentVariation.isLongVariation();
};


/**
 * Play the given move after the current one.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node object, to represents the new move.
 * @throws {InvalidNotation} If the move notation cannot be parsed.
 */
Node.prototype.play = function(move) {
	this._next = new Node(this._parentVariation, this, move);
	return this._next;
};


/**
 * Create a new variation that can be played instead of the current move.
 */
Node.prototype.addVariation = function(isLongVariation) {
	this._variations.push(new Variation(this, isLongVariation));
	return this._variations[this._variations.length - 1];
};



// -----------------------------------------------------------------------------
// Variation
// -----------------------------------------------------------------------------

/**
 * Represent one variation in the tree structure formed by a chess game, meaning
 * a starting chess position and list of played consecutively from this position.
 *
 * @param {Node|Game} parent Parent node in the tree structure.
 * @param {boolean} isLongVariation Whether the variation is long or short.
 */
function Variation(parent, isLongVariation) {

	this._parent = parent;   // Either a `Node` or a `Game` object.
	this._first = undefined; // First node of the variation (always a `Node` object if defined).

	// Whether the variation is or not to a "long-variation".
	this._isLongVariation = isLongVariation;

	// Annotations and comments associated to the current variation.
	this._nags = {};
	this._tags = {};
	this._comment = undefined;
	this._isLongComment = false;
}


/**
 * Whether the current variation is considered as a "long" variation, i.e. a variation that
 * should be displayed in an isolated block.
 *
 * @returns {boolean}
 */
Variation.prototype.isLongVariation = function() {
	return this._isLongVariation && (this._parent instanceof Game || this._parent._parentVariation.isLongVariation());
};


/**
 * Chess position at the beginning of the variation.
 *
 * @returns {Position}
 */
Variation.prototype.initialPosition = function() {
	return (this._parent instanceof Game) ? this._parent.initialPosition() : this._parent.positionBefore();
};


/**
 * Full-move number at the beginning of the variation.
 *
 * @returns {number}
 */
Variation.prototype.initialFullMoveNumber = function() {
	return this._parent._fullMoveNumber; // REMARK: `this._parent` can be `Game` or `Node`.
};


/**
 * First move within the variation.
 *
 * @returns {Node?} `undefined` if the variation is empty.
 */
Variation.prototype.first = function() {
	return this._first;
};


// Methods inherited from `Node`.
Variation.prototype.nags          = Node.prototype.nags         ;
Variation.prototype.hasNag        = Node.prototype.hasNag       ;
Variation.prototype.addNag        = Node.prototype.addNag       ;
Variation.prototype.removeNag     = Node.prototype.removeNag    ;
Variation.prototype.tags          = Node.prototype.tags         ;
Variation.prototype.tag           = Node.prototype.tag          ;
Variation.prototype.comment       = Node.prototype.comment      ;
Variation.prototype.isLongComment = Node.prototype.isLongComment;


/**
 * Play the given move as the first move of the variation.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node object, to represents the new move.
 * @throws {InvalidNotation} If the move notation cannot be parsed.
 */
Variation.prototype.play = function(move) {
	this._first = new Node(this, undefined, move);
};
