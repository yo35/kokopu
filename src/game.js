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


var bt = require('./basetypes');
var exception = require('./exception');
var i18n = require('./i18n');

var Position = require('./position').Position;



// -----------------------------------------------------------------------------
// Game
// -----------------------------------------------------------------------------

/**
 * @class
 * @classdesc Chess game, with some headers, a main variation, and a result.
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
 * Get the player name.
 *
 * @param {Color} color
 * @returns {string?}
 *
 *//**
 *
 * Set the player name.
 *
 * @param {Color} color
 * @param {string?} value
 */
Game.prototype.playerName = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerName()'); }
	if(arguments.length === 1) { return this._playerName[color]; }
	else { this._playerName[color] = value; }
};


/**
 * Get the player elo.
 *
 * @param {Color} color
 * @returns {string?}
 *
 *//**
 *
 * Set the player elo.
 *
 * @param {Color} color
 * @param {string?} value
 */
Game.prototype.playerElo = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerElo()'); }
	if(arguments.length === 1) { return this._playerElo[color]; }
	else { this._playerElo[color] = value; }
};


/**
 * Get the player title.
 *
 * @param {Color} color
 * @returns {string?}
 *
 *//**
 *
 * Set the player title.
 *
 * @param {Color} color
 * @param {string?} value
 */
Game.prototype.playerTitle = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerTitle()'); }
	if(arguments.length === 1) { return this._playerTitle[color]; }
	else { this._playerTitle[color] = value; }
};


/**
 * Get the event.
 *
 * @returns {string?}
 *
 *//**
 *
 * Set the event.
 *
 * @param {string?} value
 */
Game.prototype.event = function(value) {
	if(arguments.length === 0) { return this._event; }
	else { this._event = value; }
};


/**
 * Get the round.
 *
 * @returns {string?}
 *
 *//**
 *
 * Set the round.
 *
 * @param {string?} value
 */
Game.prototype.round = function(value) {
	if(arguments.length === 0) { return this._round; }
	else { this._round = value; }
};


/**
 * Get the date of the game.
 *
 * @returns {Date|{year:number, month:number}|{year:number}|undefined} Depending on what is defined, the method returns
 *          the whole date, or just the year and the month, or just the year, or `undefined`.
 *
 *//**
 *
 * Set the date of the game.
 *
 * @param {Date|{year:number, month:number}|{year:number}|undefined} value
 */
Game.prototype.date = function(value) {
	if(arguments.length === 0) {
		return this._date;
	}
	else if(value === undefined || value === null) {
		this._date = undefined;
	}
	else if(value instanceof Date) {
		this._date = value;
	}
	else if(typeof value === 'object' && typeof value.year === 'number' && typeof value.month === 'number') {
		this._date = { year: value.year, month: value.month };
	}
	else if(typeof value === 'object' && typeof value.year === 'number' && (value.month === undefined || value.month === null)) {
		this._date = { year: value.year };
	}
	else {
		throw new exception.IllegalArgument('Game#date()');
	}
};


/**
 * Get where the game takes place.
 *
 * @returns {string?}
 *
 *//**
 *
 * Set where the game takes place.
 *
 * @param {string?} value
 */
Game.prototype.site = function(value) {
	if(arguments.length === 0) { return this._site; }
	else { this._site = value; }
};


/**
 * Get the name of the annotator.
 *
 * @returns {string?}
 *
 *//**
 *
 * Set the name of the annotator.
 *
 * @param {string?} value
 */
Game.prototype.annotator = function(value) {
	if(arguments.length === 0) { return this._annotator; }
	else { this._annotator = value; }
};


/**
 * Get the result of the game.
 *
 * @returns {GameResult}
 *
 *//**
 *
 * Set the result of the game.
 *
 * @param {GameResult} value
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
 * Get the initial position of the game.
 *
 * @returns {Position}
 *
 *//**
 *
 * Set the initial position of the game.
 *
 * WARNING: this resets the main variation.
 *
 * @param {Position} initialPosition
 * @param {number} [fullMoveNumber=1]
 */
Game.prototype.initialPosition = function(initialPosition, fullMoveNumber) {
	if(arguments.length === 0) {
		return this._initialPosition;
	}
	else {
		if(!(initialPosition instanceof Position)) {
			throw new exception.IllegalArgument('Game#initialPosition()');
		}
		if(arguments.length === 1) {
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
 * The main variation of the game.
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
 * @class
 * @classdesc Represent one move in the tree structure formed by a chess game with multiple variations.
 *
 * @description This constructor is not exposed in the public Kokopu API. Only internal objects and functions
 *              are allowed to instantiate {@link Node} objects.
 */
function Node(parentVariation, previous, move) {

	this._parentVariation = parentVariation;  // Variation to which the current node belongs (always a `Variation` object).
	this._previous = previous; // Previous node (always a `Node` object if defined).
	this._next = undefined; // Next node (always a `Node` object if defined).
	this._position = new Position(previous === undefined ? parentVariation.initialPosition() : previous.position());

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
	if(previous === undefined) {
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
	return this._previous === undefined ? this._parentVariation.initialPosition() : this._previous.position();
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
 * @returns {Color}
 */
Node.prototype.moveColor = function() {
	return this.positionBefore().turn();
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
 * Check whether the current move has the given NAG or not.
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
		if(this._tags[key] !== undefined) {
			res.push(key);
		}
	}
	return res;
};


/**
 * Get the value associated to the given tag key on the current move.
 *
 * @param {string} tagKey
 * @returns {string?} `undefined` if no value is associated to this tag key on the current move.
 *
 *//**
 *
 * Set the value associated to the given tag key on the current move.
 *
 * @param {string} tagKey
 * @param {string?} value
 */
Node.prototype.tag = function(tagKey, value) {
	if(arguments.length === 1) {
		return this._tags[tagKey];
	}
	else {
		this._tags[tagKey] = value;
	}
};


/**
 * Get the text comment associated to the current move.
 *
 * @returns {string?} `undefined` if no comment is defined for the move.
 *
 *//**
 *
 * Set the text comment associated to the current move.
 *
 * @param {string} value
 * @param {boolean} [isLongComment=false]
 */
Node.prototype.comment = function(value, isLongComment) {
	if(arguments.length === 0) {
		return this._comment;
	}
	else {
		this._comment = value;
		this._isLongComment = !!isLongComment;
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
 * Play the given move, and -- as a result -- create a new {@link Node} after the current one.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node object, to represents the new move.
 * @throws {module:exception.InvalidNotation} If the move notation cannot be parsed.
 */
Node.prototype.play = function(move) {
	this._next = new Node(this._parentVariation, this, move);
	return this._next;
};


/**
 * Create a new variation that can be played instead of the current move.
 *
 * @param {boolean} isLongVariation
 * @returns {Variation}
 */
Node.prototype.addVariation = function(isLongVariation) {
	this._variations.push(new Variation(this, isLongVariation));
	return this._variations[this._variations.length - 1];
};



// -----------------------------------------------------------------------------
// Variation
// -----------------------------------------------------------------------------

/**
 * @class
 * @classdesc Represent one variation in the tree structure formed by a chess game, meaning
 * a starting chess position and list of played consecutively from this position.
 *
 * @description This constructor is not exposed in the public Kokopu API. Only internal objects and functions
 *              are allowed to instantiate {@link Variation} objects.
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
 * First move of the variation.
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
Variation.prototype.isLongComment = function() {
	return this._isLongComment && this.isLongVariation();
};


/**
 * Play the given move as the first move of the variation.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node object, to represents the new move.
 * @throws {module:exception.InvalidNotation} If the move notation cannot be parsed.
 */
Variation.prototype.play = function(move) {
	this._first = new Node(this, undefined, move);
	return this._first;
};
