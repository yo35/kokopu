/******************************************************************************
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
	this._mainVariationInfo = createVariationInfo(this, true);
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
		this._mainVariationInfo = createVariationInfo(this, true);
	}
};


/**
 * The main variation of the game.
 *
 * @returns {Variation}
 */
Game.prototype.mainVariation = function() {
	return new Variation(this._mainVariationInfo, this._initialPosition);
};


/**
 * Return the node or variation corresponding to the given ID (see {@link Node#id} and {@link Variation#id}
 * to retrieve the ID of a node or variation).
 *
 * @return {(Node|Variation)?} `undefined` is returned if the given ID does not correspond to an existing {@link Node} and {@link Variation}.
 */
Game.prototype.findById = function(id) {
	var tokens = id.split('-');
	if (tokens.length % 2 !== 1) {
		return undefined;
	}
	var position = new Position(this._initialPosition);

	// Find the parent variation of the target node.
	var variationInfo = this._mainVariationInfo;
	for (var i = 0; i + 1 < tokens.length; i += 2) {
		var nodeInfo = findNode(variationInfo, tokens[i], position);
		if (!nodeInfo) {
			return undefined;
		}
		var match = /^v(\d+)$/.exec(tokens[i + 1]);
		if (!match) {
			return undefined;
		}
		var variationIndex = parseInt(match[1]);
		if (variationIndex >= nodeInfo.variations.length) {
			return undefined;
		}
		variationInfo = nodeInfo.variations[variationIndex];
	}

	// Find the target node within its parent variation, or return the variation itself
	// if the ID is a variation ID (i.e. if it ends with 'start').
	var lastToken = tokens[tokens.length - 1];
	if (lastToken === 'start') {
		return new Variation(variationInfo, position);
	}
	else {
		var nodeInfo = findNode(variationInfo, lastToken, position);
		return nodeInfo ? new Node(nodeInfo, position) : undefined;
	}
};


function findNode(variationInfo, nodeIdToken, position) {
	var nodeInfo = variationInfo.child;
	while (nodeInfo) {
		if (nodeIdToken === nodeInfo.fullMoveNumber + nodeInfo.moveColor) {
			return nodeInfo;
		}
		applyMoveDescriptor(position, nodeInfo);
		nodeInfo = nodeInfo.child;
	}
	return undefined;
}


/**
 * Return the {@link Node}-s corresponding to the moves of the main variation.
 *
 * @param {boolean} [withSubVariations=false] If `true`, the nodes of the sub-variations are also included in the result.
 * @returns {Node[]} An empty array is returned if the main variation is empty.
 */
Game.prototype.nodes = function(withSubVariations) {
	if (!withSubVariations) {
		return this.mainVariation().nodes();
	}

	var result = [];
	function processVariation(variation) {
		var currentNodes = variation.nodes();
		for (var i = 0; i < currentNodes.length; ++i) {
			var nextVariations = currentNodes[i].variations();
			for (var j = 0; j < nextVariations.length; ++j) {
				processVariation(nextVariations[j]);
			}
			result.push(currentNodes[i]);
		}
	}
	processVariation(this.mainVariation());
	return result;
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
 * @param {object} parentVariation VariantInfo struct
 * @param {Color} moveColor
 * @param {number} fullMoveNumber
 * @param {MoveDescriptor} moveDescriptor
 * @returns {object}
 * @ignore
 */
function createNodeInfo(parentVariation, moveColor, fullMoveNumber, moveDescriptor) {
	return {
		parentVariation: parentVariation,

		// Attributes of the current move.
		moveColor: moveColor,
		fullMoveNumber: fullMoveNumber,
		moveDescriptor: moveDescriptor, // `moveDescriptor` is `undefined` in case of a null-move.

		// Next move and alternative variations.
		child: undefined,
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
function Node(info, positionBefore) {
	this._info = info;
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
 * Identifier of the current node within its parent {@link Game}.
 *
 * WARNING: the ID may change when variations are modified (added, removed, swapped, promoted...)
 * among the parents the current node.
 *
 * @returns {string}
 */
Node.prototype.id = function() {
	return buildNodeId(this._info);
};


/**
 * Compute the ID of the given node.
 *
 * @param {object} nodeInfo NodeInfo struct
 * @returns {string}
 * @ignore
 */
function buildNodeId(nodeInfo) {
	return buildVariationIdPrefix(nodeInfo.parentVariation) + nodeInfo.fullMoveNumber + nodeInfo.moveColor;
}


/**
 * Return the {@link Variation} that owns the current node.
 *
 * @returns {Variation}
 */
Node.prototype.parentVariation = function() {
	var position = rebuildVariationPosition(this._info.parentVariation);
	return new Variation(this._info.parentVariation, position);
};


/**
 * Return the {@link Node} that comes before the current one in their parent variation.
 *
 * @returns {Node?} `undefined` if the current node is the first one of the variation.
 */
Node.prototype.previous = function() {
	var position = rebuildVariationPosition(this._info.parentVariation);
	var current = this._info.parentVariation.child;
	if (current === this._info) {
		return undefined;
	}
	while (current.child !== this._info) {
		applyMoveDescriptor(position, current);
		current = current.child;
	}
	return new Node(current, position);
};


/**
 * Return the initial position of the given variation.
 *
 * @param {object} variationInfo VariationInfo
 * @returns {Position}
 * @ignore
 */
function rebuildVariationPosition(variationInfo) {
	if (variationInfo.parentNode instanceof Game) {
		return new Position(variationInfo.parentNode._initialPosition);
	}
	else {
		var position = rebuildVariationPosition(variationInfo.parentNode.parentVariation);
		var current = variationInfo.parentNode.parentVariation.child;
		while (current !== variationInfo.parentNode) {
			applyMoveDescriptor(position, current);
			current = current.child;
		}
		return position;
	}
}


/**
 * SAN representation of the move associated to the current node (or `'--'` for a null-move).
 *
 * @returns {string}
 */
Node.prototype.notation = function() {
	return this._info.moveDescriptor === undefined ? '--' : this._positionBefore.notation(this._info.moveDescriptor);
};


/**
 * SAN-like representation of the move associated to the current node (or `'--'` for a null-move).
 *
 * @returns {string} Chess pieces are represented with their respective unicode character, instead of the first letter of their English name.
 */
Node.prototype.figurineNotation = function() {
	return this._info.moveDescriptor === undefined ? '--' : this._positionBefore.figurineNotation(this._info.moveDescriptor);
};


/**
 * Chess position before the current move.
 *
 * @returns {Position}
 */
Node.prototype.positionBefore = function() {
	return new Position(this._positionBefore);
};


/**
 * Chess position obtained after the current move.
 *
 * @returns {Position}
 */
Node.prototype.position = function() {
	var position = this.positionBefore();
	applyMoveDescriptor(position, this._info);
	return position;
};


/**
 * Full-move number. It starts at 1, and is incremented after each black move.
 *
 * @returns {number}
 */
Node.prototype.fullMoveNumber = function() {
	return this._info.fullMoveNumber;
};


/**
 * Color the side corresponding to the current move.
 *
 * @returns {Color}
 */
Node.prototype.moveColor = function() {
	return this._info.moveColor;
};


/**
 * Return the {@link Node} that comes after the current one in their parent variation.
 *
 * @returns {Node?} `undefined` if the current node is the last one of the variation.
 */
Node.prototype.next = function() {
	if (!this._info.child) {
		return undefined;
	}
	var nextPositionBefore = new Position(this._positionBefore);
	applyMoveDescriptor(nextPositionBefore, this._info);
	return new Node(this._info.child, nextPositionBefore);
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
	for(var i = 0; i < this._info.variations.length; ++i) {
		result.push(new Variation(this._info.variations[i], this._positionBefore));
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
	return this._info.isLongComment && doIsLongVariation(this._info.parentVariation);
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
	var nextPositionBefore = new Position(this._positionBefore);
	applyMoveDescriptor(nextPositionBefore, this._info);
	var nextMoveColor = nextPositionBefore.turn();
	var nextFullMoveNumber = nextMoveColor === 'w' ? this._info.fullMoveNumber + 1: this._info.fullMoveNumber;
	this._info.child = createNodeInfo(this._info.parentVariation, nextMoveColor, nextFullMoveNumber, computeMoveDescriptor(nextPositionBefore, move));
	return new Node(this._info.child, nextPositionBefore);
};


/**
 * Erase all the moves after the one on the current {@link Node}: after that, {@link Node#next} returns `undefined`.
 * If the current {@link Node} is already the last one in its variation (i.e. if {@link Node#next} returns `undefined` already),
 * nothing happens.
 */
Node.prototype.removeFollowingMoves = function() {
	this._info.child = undefined;
};


/**
 * Create a new variation that can be played instead of the current move.
 *
 * @param {boolean} isLongVariation
 * @returns {Variation}
 */
Node.prototype.addVariation = function(isLongVariation) {
	this._info.variations.push(createVariationInfo(this._info, isLongVariation));
	return new Variation(this._info.variations[this._info.variations.length - 1], this._positionBefore);
};


/**
 * Remove the variation corresponding to the givn index.
 *
 * @param {number} variationIndex Index of the variation to promote (must be such that `0 <= variationIndex < thisNode.variations().length`).
 */
Node.prototype.removeVariation = function(variationIndex) {
	if (!this._info.variations[variationIndex]) {
		throw new exception.IllegalArgument('Node#removeVariation()');
	}
	this._info.variations = this._info.variations.slice(0, variationIndex).concat(this._info.variations.slice(variationIndex + 1));
};


/**
 * Change the order of the variations by swapping the two variations corresponding to the given indexes.
 *
 * @param {number} variationIndex1 Index of one variation to swap (must be such that `0 <= variationIndex1 < thisNode.variations().length`).
 * @param {number} variationIndex2 Index of the other variation to swap (must be such that `0 <= variationIndex2 < thisNode.variations().length`).
 */
Node.prototype.swapVariations = function(variationIndex1, variationIndex2) {
	var variation1 = this._info.variations[variationIndex1];
	var variation2 = this._info.variations[variationIndex2];
	if (!variation1 || !variation2) {
		throw new exception.IllegalArgument('Node#swapVariations()');
	}
	this._info.variations[variationIndex1] = variation2;
	this._info.variations[variationIndex2] = variation1;
};


/**
 * Replace the move on the current node (and the following ones, if any) by the moves of the variation corresponding to the given index,
 * and create a new variation with the move on the current node and its successors.
 *
 * WARNING: the promoted variation must NOT be empty.
 *
 * @param {number} variationIndex Index of the variation to promote (must be such that `0 <= variationIndex < thisNode.variations().length`).
 *                                If the corresponding variation is empty, an exception is thrown.
 */
Node.prototype.promoteVariation = function(variationIndex) {
	var variationToPromote = this._info.variations[variationIndex];
	if (!variationToPromote || !variationToPromote.child) {
		throw new exception.IllegalArgument('Node#promoteVariation()');
	}
	var oldMainLine = this._info;
	var newMainLine = variationToPromote.child;

	// Detach the array containing the variations from the current node.
	var variations = oldMainLine.variations;
	oldMainLine.variations = [];

	// Create a new variation with the old main line.
	variations[variationIndex] = createVariationInfo(newMainLine, false);
	variations[variationIndex].child = oldMainLine;

	// Create a new main line with the promoted variation, and re-attach the variations.
	this._info = newMainLine;
	newMainLine.variations = variations.concat(newMainLine.variations);

	// Re-map the parents.
	var parent = findParent(oldMainLine);
	parent.child = newMainLine;
	resetParentVariationRecursively(newMainLine, oldMainLine.parentVariation);
	resetParentVariationRecursively(oldMainLine, variations[variationIndex]);
	for (var variationIndex = 0; variationIndex < newMainLine.variations.length; ++variationIndex) {
		newMainLine.variations[variationIndex].parentNode = newMainLine;
	}
};


function findParent(oldMainLine) {
	var candidate = oldMainLine.parentVariation;
	while (candidate.child !== oldMainLine) {
		candidate = candidate.child;
	}
	return candidate;
}


function resetParentVariationRecursively(root, newParentVariation) {
	while (root) {
		root.parentVariation = newParentVariation;
		root = root.child;
	}
}


// -----------------------------------------------------------------------------
// Variation
// -----------------------------------------------------------------------------

/**
 * @param {object|Game} parentNode NodeInfo struct (or `Game` for the main variation)
 * @param {boolean} isLongVariation
 * @returns {object}
 * @ignore
 */
function createVariationInfo(parentNode, isLongVariation) {
	return {
		parentNode: parentNode,
		isLongVariation: isLongVariation,

		// First move of the variation.
		child: undefined,

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
function Variation(info, initialPosition) {
	this._info = info;
	this._initialPosition = initialPosition;
}


/**
 * Identifier of the current variation within its parent {@link Game}.
 *
 * WARNING: the ID may change when variations are modified (added, removed, swapped, promoted...)
 * among the parents the current variation.
 *
 * @returns {string}
 */
Variation.prototype.id = function() {
	return buildVariationIdPrefix(this._info) + 'start';
};


/**
 * Compute the ID of the given variation, without the final `'start'` token.
 *
 * @param {object} variationInfo VariationInfo struct
 * @returns {string}
 * @ignore
 */
function buildVariationIdPrefix(variationInfo) {
	if (variationInfo.parentNode instanceof Game) {
		return '';
	}
	else {
		var parentNodeId = buildNodeId(variationInfo.parentNode);
		var variationIndex = variationInfo.parentNode.variations.indexOf(variationInfo);
		return parentNodeId + '-v' + variationIndex + '-';
	}
}


/**
 * Return the {@link Node} to which the current variation is attached.
 *
 * @returns {Node?} `undefined` if the current variation is the main one (see {@link Game#mainVariation}).
 */
Variation.prototype.parentNode = function() {
	return this._info.parentNode instanceof Game ? undefined : new Node(this._info.parentNode, this._initialPosition);
};


/**
 * Whether the current variation is considered as a "long" variation, i.e. a variation that
 * should be displayed in an isolated block.
 *
 * @returns {boolean}
 */
Variation.prototype.isLongVariation = function() {
	return doIsLongVariation(this._info);
};


/**
 * Whether the variation corresponding to the given descriptor is a "long variation",
 * i.e. whether it is a flagged as "isLongVariation" AND SO ARE ALL IT'S PARENTS.
 *
 * @param {object} variationInfo VariationInfo struct
 * @returns {boolean}
 * @ignore
 */
function doIsLongVariation(variationInfo) {
	while (true) {
		if (!variationInfo.isLongVariation) {
			return false;
		}
		if (variationInfo.parentNode instanceof Game) {
			return true;
		}
		variationInfo = variationInfo.parentNode.parentVariation;
	}
}


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
	return this._info.parentNode instanceof Game ? this._info.parentNode._fullMoveNumber : this._info.parentNode.fullMoveNumber;
};


/**
 * First move of the variation.
 *
 * @returns {Node?} `undefined` if the variation is empty.
 */
Variation.prototype.first = function() {
	if (!this._info.child) {
		return undefined;
	}
	return new Node(this._info.child, this._initialPosition);
};


/**
 * Return the {@link Node}-s corresponding to the moves of the current variation.
 *
 * @returns {Node[]} An empty array is returned if the variation is empty.
 */
Variation.prototype.nodes = function() {
	var result = [];

	var currentNodeInfo = this._info.child;
	var previousNodeInfo = undefined;
	var previousPositionBefore = this._initialPosition;
	while (currentNodeInfo) {

		// Compute the "position-before" attribute the current node.
		previousPositionBefore = new Position(previousPositionBefore);
		if (previousNodeInfo) {
			applyMoveDescriptor(previousPositionBefore, previousNodeInfo);
		}

		// Push the current node.
		result.push(new Node(currentNodeInfo, previousPositionBefore));

		// Increment the counters.
		previousNodeInfo = currentNodeInfo;
		currentNodeInfo = currentNodeInfo.child;
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
	return this._info.isLongComment && this.isLongVariation();
};


/**
 * Play the given move as the first move of the variation.
 *
 * @param {string} move SAN notation (or `'--'` for a null-move).
 * @returns {Node} A new node object, to represents the new move.
 * @throws {module:exception.InvalidNotation} If the move notation cannot be parsed.
 */
Variation.prototype.play = function(move) {
	this._info.child = createNodeInfo(this._info, this._initialPosition.turn(), this.initialFullMoveNumber(), computeMoveDescriptor(this._initialPosition, move));
	return new Node(this._info.child, this._initialPosition);
};


/**
 * Erase all the moves in the current {@link Variation}: after that, {@link Variation#first} returns `undefined`.
 * If the current {@link Variation} is already empty (i.e. if {@link Variation#first} returns `undefined` already),
 * nothing happens.
 */
Variation.prototype.clearMoves = function() {
	this._info.child = undefined;
};
