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


var helper = require('../helper');
var Position = require('../position').Position;
var common = require('./common');


function trimCollapseAndMarkEmpty(text) {
	text = common.trimAndCollapseSpaces(text);
	return text === '' ? '<empty>' : text;
}


function formatSimpleHeader(key, header) {
	return header === undefined ? undefined : key + ': ' + trimCollapseAndMarkEmpty(header);
}


function formatEventAndRound(event, round) {
	if (event === undefined && round === undefined) {
		return undefined;
	}
	var result = 'Event: ' + (event === undefined ? '<undefined>' : trimCollapseAndMarkEmpty(event));
	if (round !== undefined) {
		result += ' (' + trimCollapseAndMarkEmpty(round) + ')';
	}
	return result;
}


function formatDate(dateAsString) {
	return dateAsString === undefined ? undefined : 'Date: ' + dateAsString;
}


function formatPlayer(key, playerName, playerElo, playerTitle) {
	if (playerName === undefined && playerElo === undefined && playerTitle === undefined) {
		return undefined;
	}
	var result = key + ': ' + (playerName === undefined ? '<undefined>' : trimCollapseAndMarkEmpty(playerName));
	if (playerElo !== undefined && playerTitle !== undefined) {
		result += ' (' + trimCollapseAndMarkEmpty(playerTitle) + ' ' + trimCollapseAndMarkEmpty(playerElo) + ')';
	}
	else if (playerElo !== undefined) {
		result += ' (' + trimCollapseAndMarkEmpty(playerElo) + ')';
	}
	else if (playerTitle !== undefined) {
		result += ' (' + trimCollapseAndMarkEmpty(playerTitle) + ')';
	}
	return result;
}


/* eslint-disable no-mixed-spaces-and-tabs */

var NAG_SYMBOLS = {
	 3: '!!' ,    // very good move
	 1: '!'  ,    // good move
	 5: '!?' ,    // interesting move
	 6: '?!' ,    // questionable move
	 2: '?'  ,    // bad move
	 4: '??' ,    // very bad move
	18: '+-' ,    // White has a decisive advantage
	16: '\u00b1', // White has a moderate advantage
	14: '\u2a72', // White has a slight advantage
	10: '='  ,    // equal position
	13: '\u221e', // unclear position
	15: '\u2a71', // Black has a slight advantage
	17: '\u2213', // Black has a moderate advantage
	19: '-+' ,    // Black has a decisive advantage
};

/* eslint-enable no-mixed-spaces-and-tabs */


function formatAnnotations(node) {
	var result = [];

	// NAGs
	var nags = node.nags();
	for (var k = 0; k < nags.length; ++k) {
		var nag = nags[k];
		result.push(nag in NAG_SYMBOLS ? NAG_SYMBOLS[nag] : '$' + nag);
	}

	// Tags
	var tags = node.tags();
	for (var k = 0; k < tags.length; ++k) {
		var tag = tags[k];
		result.push(tag + '={' + common.trimAndCollapseSpaces(node.tag(tag)) + '}');
	}

	// Comment
	var comment = node.comment();
	if (comment !== undefined) {
		result.push(trimCollapseAndMarkEmpty(comment));
	}

	return result;
}


/**
 * Return an ASCII representation of the given game.
 */
exports.ascii = function(game) {

	var lines = [];
	function pushIfDefined(header) {
		if (header) {
			lines.push(header);
		}
	}

	// Headers
	pushIfDefined(formatEventAndRound(game._event, game._round));
	pushIfDefined(formatSimpleHeader('Site', game._site));
	pushIfDefined(formatDate(game.dateAsString('en-us')));
	pushIfDefined(formatPlayer('White', game._playerName[0], game._playerElo[0], game._playerTitle[0]));
	pushIfDefined(formatPlayer('Black', game._playerName[1], game._playerElo[1], game._playerTitle[1]));
	pushIfDefined(formatSimpleHeader('Annotator', game._annotator));

	// Variant & initial position
	var variant = game._initialPosition.variant();
	if (variant !== 'regular') {
		lines.push('Variant: ' + variant);
	}
	if (!helper.variantWithCanonicalStartPosition(variant) || game._initialPosition.fen() !== new Position(variant).fen()) {
		lines.push(game._initialPosition.ascii());
	}

	// Moves & result

	function isNonEmptyVariation(variation) {
		return variation.first() || variation.nags().length > 0 || variation.tags().length > 0 || variation.comment() !== undefined;
	}

	function dumpNode(node, indent, hasSomethingAfter) {

		// Describe the move
		var move = indent + node.fullMoveNumber() + (node.moveColor() === 'w' ? '.' : '...') + node.notation();
		var moveAnnotations = formatAnnotations(node);
		lines.push(moveAnnotations.length === 0 ? move : move + ' ' + moveAnnotations.join(' '));

		// Print the sub-variations
		var variations = node.variations();
		var atLeastOneNonEmptyVariation = false;
		for (var k = 0; k < variations.length; ++k) {
			if (isNonEmptyVariation(variations[k])) {
				lines.push(indent + ' |');
				dumpVariation(variations[k], indent + (hasSomethingAfter ? ' |  ' : '    '), indent + ' +- ');
				atLeastOneNonEmptyVariation = true;
			}
		}
		return atLeastOneNonEmptyVariation;
	}

	function dumpVariation(variation, indent, indentFirst, hasSomethingAfter) {

		// Variation annotations
		var variationAnnotations = formatAnnotations(variation);
		if (variationAnnotations.length > 0) {
			lines.push(indentFirst + variationAnnotations.join(' '));
		}

		// List of moves
		var node = variation.first();
		var atLeastOneVariationInPreviousNode = false;
		var isFirstNode = true;
		while (node) {
			if (atLeastOneVariationInPreviousNode) {
				lines.push(indent + ' |');
			}
			var nextNode = node.next();
			atLeastOneVariationInPreviousNode = dumpNode(node, isFirstNode && variationAnnotations.length === 0 ? indentFirst : indent, hasSomethingAfter || nextNode);
			isFirstNode = false;
			node = nextNode;
		}
	}

	dumpVariation(game.mainVariation(), '', '', false);
	lines.push(game.result());

	return lines.join('\n');
};
