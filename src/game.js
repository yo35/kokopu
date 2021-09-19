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


var bt = require('./basetypes');
var exception = require('./exception');
var i18n = require('./i18n');
var asciiImpl = require('./private_game/ascii_impl');

var Position = require('./position').Position;



// -----------------------------------------------------------------------------
// Game
// -----------------------------------------------------------------------------

/**
 * @class
 * @classdesc Chess game, with the move history, the position at each step of the game,
 *            the comments and annotations (if any), the result of the game,
 *            and some meta-data such as the name of the players, the date of the game,
 *            the name of the tournament, etc...
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
	this._mainVariationInfo = createVariationInfo(true);
};


function sanitizeStringHeader(value) {
	return value === undefined || value === null ? undefined : String(value);
}


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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.playerName = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerName()'); }
	if(arguments.length === 1) { return this._playerName[color]; }
	else { this._playerName[color] = sanitizeStringHeader(value); }
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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.playerElo = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerElo()'); }
	if(arguments.length === 1) { return this._playerElo[color]; }
	else { this._playerElo[color] = sanitizeStringHeader(value); }
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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.playerTitle = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerTitle()'); }
	if(arguments.length === 1) { return this._playerTitle[color]; }
	else { this._playerTitle[color] = sanitizeStringHeader(value); }
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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.event = function(value) {
	if(arguments.length === 0) { return this._event; }
	else { this._event = sanitizeStringHeader(value); }
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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.round = function(value) {
	if(arguments.length === 0) { return this._round; }
	else { this._round = sanitizeStringHeader(value); }
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
		if (this._date instanceof Date) {
			return new Date(this._date);
		}
		else if (this._date) {
			return Object.assign({}, this._date);
		}
		else {
			return undefined;
		}
	}
	else if(value === undefined || value === null) {
		this._date = undefined;
	}
	else if(value instanceof Date) {
		this._date = new Date(value);
	}
	else if(typeof value === 'object' && typeof value.year === 'number' && typeof value.month === 'number' && value.month >= 1 && value.month <= 12) {
		this._date = { year: Math.round(value.year), month: Math.round(value.month) };
	}
	else if(typeof value === 'object' && typeof value.year === 'number' && (value.month === undefined || value.month === null)) {
		this._date = { year: Math.round(value.year) };
	}
	else {
		throw new exception.IllegalArgument('Game#date()');
	}
};


/**
 * Get the date of the game as a human-readable string (e.g. `'November 1955'`, `'September 4, 2021'`).
 *
 * @param {*?} locales Locales to use to generate the result. If undefined, the default locale of the execution environment is used.
 *                     See [Intl documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
 *                     for more details.
 * @returns {string?}
 */
Game.prototype.dateAsString = function(locales) {
	if (!this._date) {
		return undefined;
	}
	if (this._date instanceof Date) {
		return new Intl.DateTimeFormat(locales, { dateStyle: 'long' }).format(this._date);
	}
	else if (this._date.month) {
		var firstDay = new Date(this._date.year, this._date.month - 1, 1);
		return new Intl.DateTimeFormat(locales, { month: 'long', year: 'numeric' }).format(firstDay);
	}
	else {
		return String(this._date.year);
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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.site = function(value) {
	if(arguments.length === 0) { return this._site; }
	else { this._site = sanitizeStringHeader(value); }
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
 * @param {*?} value If `null` or `undefined`, the existing value (if any) is erased.
 */
Game.prototype.annotator = function(value) {
	if(arguments.length === 0) { return this._annotator; }
	else { this._annotator = sanitizeStringHeader(value); }
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
 * Get the {@link GameVariant} of the game.
 *
 * @returns {GameVariant}
 */
Game.prototype.variant = function() {
	return this._initialPosition.variant();
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
		this._mainVariationInfo = createVariationInfo(true);
	}
};


/**
 * The main variation of the game.
 *
 * @returns {Variation}
 */
Game.prototype.mainVariation = function() {
	return new Variation(this._mainVariationInfo, this._fullMoveNumber, this._initialPosition, true);
};


/**
 * Return a human-readable string representing the game. This string is multi-line,
 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
 *
 * @returns {string}
 */
Game.prototype.ascii = function() {
	return asciiImpl.ascii(this);
};



// -----------------------------------------------------------------------------
// Node
// -----------------------------------------------------------------------------

/**
 * @param {MoveDescriptor} moveDescriptor
 * @returns {object}
 * @ignore
 */
function createNodeInfo(moveDescriptor) {
	return {

		// `moveDescriptor` is `undefined` in case of a null-move.
		moveDescriptor: moveDescriptor,

		// Next move and alternative variations.
		next: undefined,
		variations: [],

		// Annotations and comments associated to the underlying move.
		nags: {},
		tags: {},
		comment: undefined,
		isLongComment: false
	};
}


/**
 * @class
 * @classdesc Represent one move in the tree structure formed by a chess game with multiple variations.
 *
 * @description This constructor is not exposed in the public Kokopu API. Only internal objects and functions
 *              are allowed to instantiate {@link Node} objects.
 */
function Node(info, parentVariation, fullMoveNumber, positionBefore) {
	this._info = info;
	this._parentVariation = parentVariation;
	this._fullMoveNumber = fullMoveNumber;
	this._positionBefore = positionBefore;
}


/**
 * Play the move descriptor encoded in the given node info structure, or play null-move if no move descriptor is defined.
 *
 * @param {Position} position
 * @param {object} info
 * @ignore
 */
function applyMoveDescriptor(position, info) {
	if(info.moveDescriptor === undefined) {
		position.playNullMove();
	}
	else {
		position.play(info.moveDescriptor);
	}
}


/**
 * Regenerate `_positionBefore` if necessary on the given node.
 *
 * @param {Node} node
 * @returns {Position}
 * @ignore
 */
function rebuildPositionBeforeIfNecessary(node) {
	if(!node._positionBefore) {
		node._positionBefore = new Position(node._parentVariation._initialPosition);
		var currentInfo = node._parentVariation._info.first;
		while(currentInfo !== node._info) {
			if(currentInfo === undefined) {
				throw new exception.IllegalArgument('The current node is invalid.');
			}
			applyMoveDescriptor(node._positionBefore, currentInfo);
			currentInfo = currentInfo.next;
		}
	}
	return node._positionBefore;
}


/**
 * SAN representation of the move associated to the current node.
 *
 * @returns {string}
 */
Node.prototype.notation = function() {
	return this._info.moveDescriptor === undefined ? '--' : rebuildPositionBeforeIfNecessary(this).notation(this._info.moveDescriptor);
};


/**
 * SAN-like representation of the move associated to the current node.
 *
 * @returns {string} Chess pieces are represented with their respective unicode character, instead of the first letter of their English name.
 */
Node.prototype.figurineNotation = function() {
	return this._info.moveDescriptor === undefined ? '--' : rebuildPositionBeforeIfNecessary(this).figurineNotation(this._info.moveDescriptor);
};


/**
 * Chess position before the current move.
 *
 * @returns {Position}
 */
Node.prototype.positionBefore = function() {
	return new Position(rebuildPositionBeforeIfNecessary(this));
};


/**
 * Chess position obtained after the current move.
 *
 * @returns {Position}
 */
Node.prototype.position = function() {
	var position = this.positionBefore();
	if(this._info.moveDescriptor === undefined) {
		position.playNullMove();
	}
	else {
		position.play(this._info.moveDescriptor);
	}
	return position;
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
	return rebuildPositionBeforeIfNecessary(this).turn();
};


/**
 * Compute the "position-before" and "full-move-number" applicable to the node after the given one.
 *
 * @param {Node} node
 * @returns {{positionBefore:Position, fullMoveNumber:number}}
 * @ignore
 */
function computePositionBeforeAndFullMoveNumberForNextNode(node) {

	// Compute the position-before applicable on the next node.
	var positionBefore = rebuildPositionBeforeIfNecessary(node);
	applyMoveDescriptor(positionBefore, node._info);

	// Compute the full-move-number applicable to the next node.
	var fullMoveNumber = positionBefore.turn() === 'w' ? node._fullMoveNumber + 1 : node._fullMoveNumber;

	// Invalidate the position-before on the current node.
	node._positionBefore = null;

	return { positionBefore:positionBefore, fullMoveNumber:fullMoveNumber };
}


/**
 * Go to the next move within the same variation.
 *
 * @returns {Node?} `undefined` if the current move is the last move of the variation, or a node corresponding to the next move otherwise.
 */
Node.prototype.next = function() {
	if(!this._info.next) { return undefined; }
	var next = computePositionBeforeAndFullMoveNumberForNextNode(this);
	return new Node(this._info.next, this._parentVariation, next.fullMoveNumber, next.positionBefore);
};


/**
 * Return the variations that can be followed instead of the current move.
 *
 * @returns {Variation[]}
 */
Node.prototype.variations = function() {
	if(this._info.variations.length === 0) {
		return [];
	}

	var result = [];
	var positionBefore = this.positionBefore();
	for(var i = 0; i < this._info.variations.length; ++i) {
		result.push(new Variation(this._info.variations[i], this._fullMoveNumber, positionBefore, this._parentVariation._withinLongVariation));
	}
	return result;
};


function isValidNag(nag) {
	return typeof nag === 'number' && !isNaN(nag) && nag >= 0;
}


/**
 * Return the NAGs associated to the current move.
 *
 * @returns {number[]} Sorted array.
 */
Node.prototype.nags = function() {
	var result = [];
	for(var key in this._info.nags) {
		result.push(Number(key));
	}
	return result.sort(function(a, b) { return a - b; });
};


/**
 * Check whether the current move has the given NAG or not.
 *
 * @param {number} nag
 * @returns {boolean}
 */
Node.prototype.hasNag = function(nag) {
	if (!isValidNag(nag)) {
		throw new exception.IllegalArgument('Node#hasNag()');
	}
	return Boolean(this._info.nags[nag]);
};


/**
 * Add the given NAG to the current move.
 *
 * @param {number} nag
 */
Node.prototype.addNag = function(nag) {
	if (!isValidNag(nag)) {
		throw new exception.IllegalArgument('Node#addNag()');
	}
	this._info.nags[nag] = true;
};


/**
 * Remove the given NAG from the current move.
 *
 * @param {number} nag
 */
Node.prototype.removeNag = function(nag) {
	if (!isValidNag(nag)) {
		throw new exception.IllegalArgument('Node#removeNag()');
	}
	delete this._info.nags[nag];
};


/**
 * Return the keys of the tags associated to the current move.
 *
 * @returns {string[]} Sorted array.
 */
Node.prototype.tags = function() {
	var result = [];
	for(var key in this._info.tags) {
		result.push(key);
	}
	return result.sort();
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
	if (!/^\w+$/.test(tagKey)) {
		throw new exception.IllegalArgument('Node#tag()');
	}
	if (arguments.length === 1) {
		return this._info.tags[tagKey];
	}
	else if (value === undefined || value === null) {
		delete this._info.tags[tagKey];
	}
	else {
		this._info.tags[tagKey] = String(value);
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
		return this._info.comment;
	}
	else {
		this._info.comment = sanitizeStringHeader(value);
		this._info.isLongComment = this._info.comment && isLongComment;
	}
};


/**
 * Whether the text comment associated to the current move is long or short.
 *
 * @returns {boolean} Always `false` if no comment is defined.
 */
Node.prototype.isLongComment = function() {
	return this._parentVariation._withinLongVariation && this._info.isLongComment;
};


/**
 * Compute the move descriptor associated to the given SAN notation, assuming the given position.
 *
 * @param {Position} position Position based on which the given SAN notation must be interpreted.
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {MoveDescriptor?} `undefined` is returned in case of a null-move.
 * @throws {module:exception.InvalidNotation} If the move notation cannot be parsed.
 * @ignore
 */
function computeMoveDescriptor(position, move) {
	if(move === '--') {
		if(!position.isNullMoveLegal()) {
			throw new exception.InvalidNotation(position, '--', i18n.ILLEGAL_NULL_MOVE);
		}
		return undefined;
	}
	else {
		return position.notation(move);
	}
}


/**
 * Play the given move, and return a new {@link Node} pointing at the resulting position.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node, pointing at the new position.
 * @throws {module:exception.InvalidNotation} If the move notation cannot be parsed.
 */
Node.prototype.play = function(move) {
	var next = computePositionBeforeAndFullMoveNumberForNextNode(this);
	this._info.next = createNodeInfo(computeMoveDescriptor(next.positionBefore, move));
	return new Node(this._info.next, this._parentVariation, next.fullMoveNumber, next.positionBefore);
};


/**
 * Create a new variation that can be played instead of the current move.
 *
 * @param {boolean} isLongVariation
 * @returns {Variation}
 */
Node.prototype.addVariation = function(isLongVariation) {
	this._info.variations.push(createVariationInfo(isLongVariation));
	return new Variation(this._info.variations[this._info.variations.length - 1], this._fullMoveNumber, this.positionBefore(), this._parentVariation._withinLongVariation);
};



// -----------------------------------------------------------------------------
// Variation
// -----------------------------------------------------------------------------

/**
 * @param {boolean} isLongVariation
 * @returns {object}
 * @ignore
 */
function createVariationInfo(isLongVariation) {
	return {

		isLongVariation: isLongVariation,

		// First move of the variation.
		first: undefined,

		// Annotations and comments associated to the underlying variation.
		nags: {},
		tags: {},
		comment: undefined,
		isLongComment: false
	};
}


/**
 * @class
 * @classdesc Represent one variation in the tree structure formed by a chess game, meaning
 * a starting chess position and list of played consecutively from this position.
 *
 * @description This constructor is not exposed in the public Kokopu API. Only internal objects and functions
 *              are allowed to instantiate {@link Variation} objects.
 */
function Variation(info, initialFullMoveNumber, initialPosition, withinLongVariation) {
	this._info = info;
	this._initialFullMoveNumber = initialFullMoveNumber;
	this._initialPosition = initialPosition;
	this._withinLongVariation = withinLongVariation && info.isLongVariation;
}


/**
 * Whether the current variation is considered as a "long" variation, i.e. a variation that
 * should be displayed in an isolated block.
 *
 * @returns {boolean}
 */
Variation.prototype.isLongVariation = function() {
	return this._withinLongVariation;
};


/**
 * Chess position at the beginning of the variation.
 *
 * @returns {Position}
 */
Variation.prototype.initialPosition = function() {
	return new Position(this._initialPosition);
};


/**
 * Full-move number at the beginning of the variation.
 *
 * @returns {number}
 */
Variation.prototype.initialFullMoveNumber = function() {
	return this._initialFullMoveNumber;
};


/**
 * First move of the variation.
 *
 * @returns {Node?} `undefined` if the variation is empty.
 */
Variation.prototype.first = function() {
	if(!this._info.first) { return undefined; }
	return new Node(this._info.first, this, this._initialFullMoveNumber, new Position(this._initialPosition));
};


/**
 * Generate the nodes corresponding to the moves of the current variation.
 *
 * @returns {Node[]} An empty array is returned if the variation is empty.
 */
Variation.prototype.nodes = function() {
	var result = [];

	var currentNodeInfo = this._info.first;
	var previousNodeInfo = null;
	var previousPositionBefore = this._initialPosition;
	var previousFullMoveNumber = this._initialFullMoveNumber;
	while(currentNodeInfo) {

		// Compute the "position-before" attribute the current node.
		var previousPositionBefore = new Position(previousPositionBefore);
		if(previousNodeInfo !== null) {
			applyMoveDescriptor(previousPositionBefore, previousNodeInfo);
		}

		// Compute the "full-move-number" attribute the current node.
		previousFullMoveNumber = previousNodeInfo !== null && previousPositionBefore.turn() === 'w' ? previousFullMoveNumber + 1 : previousFullMoveNumber;

		// Push the current node.
		result.push(new Node(currentNodeInfo, this, previousFullMoveNumber, previousPositionBefore));

		// Increment the counters.
		previousNodeInfo = currentNodeInfo;
		currentNodeInfo = currentNodeInfo.next;
	}

	return result;
};


/**
 * Return the NAGs associated to the current variation.
 *
 * @returns {number[]} Sorted array.
 * @function
 */
Variation.prototype.nags = Node.prototype.nags;


/**
 * Check whether the current variation has the given NAG or not.
 *
 * @param {number} nag
 * @returns {boolean}
 * @function
 */
Variation.prototype.hasNag = Node.prototype.hasNag;


/**
 * Add the given NAG to the current variation.
 *
 * @param {number} nag
 * @function
 */
Variation.prototype.addNag = Node.prototype.addNag;


/**
 * Remove the given NAG from the current variation.
 *
 * @param {number} nag
 * @function
 */
Variation.prototype.removeNag = Node.prototype.removeNag;


/**
 * Return the keys of the tags associated to the current variation.
 *
 * @returns {string[]} Sorted array.
 * @function
 */
Variation.prototype.tags = Node.prototype.tags;


/**
 * Get the value associated to the given tag key on the current variation.
 *
 * @param {string} tagKey
 * @returns {string?} `undefined` if no value is associated to this tag key on the current variation.
 * @function
 *
 *//**
 *
 * Set the value associated to the given tag key on the current variation.
 *
 * @param {string} tagKey
 * @param {string?} value
 * @function
 */
Variation.prototype.tag = Node.prototype.tag;


/**
 * Get the text comment associated to the current variation.
 *
 * @returns {string?} `undefined` if no comment is defined for the variation.
 * @function
 *
 *//**
 *
 * Set the text comment associated to the current variation.
 *
 * @param {string} value
 * @param {boolean} [isLongComment=false]
 * @function
 */
Variation.prototype.comment = Node.prototype.comment;


/**
 * Whether the text comment associated to the current variation is long or short.
 *
 * @returns {boolean}
 */
Variation.prototype.isLongComment = function() {
	return this._withinLongVariation && this._info.isLongComment;
};


/**
 * Play the given move as the first move of the variation.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node object, to represents the new move.
 * @throws {module:exception.InvalidNotation} If the move notation cannot be parsed.
 */
Variation.prototype.play = function(move) {
	var positionBefore = new Position(this._initialPosition);
	this._info.first = createNodeInfo(computeMoveDescriptor(positionBefore, move));
	return new Node(this._info.first, this, this._initialFullMoveNumber, positionBefore);
};
