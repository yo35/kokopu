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


var bt = require('../basetypes');
var Position = require('../position').Position;
var impl = require('./impl');


function escapeHeaderValue(value) {
	return value.replace(/([\\"])/g, '\\$1');
}


function escapeCommentValue(value) {
	return value.replace(/([\\}])/g, '\\$1');
}


function formatNullableHeader(value) {
	if (value !== undefined) {
		value = impl.trimAndCollapseSpaces(value);
	}
	return value ? escapeHeaderValue(value) : '?';
}


function formatDateHeader(date) {
	var year = '????';
	var month = '??';
	var day = '??';
	if (date instanceof Date) {
		year = String(date.getFullYear()).padStart(4, '0');
		month = String(date.getMonth() + 1).padStart(2, '0');
		day = String(date.getDate()).padStart(2, '0');
	}
	else if (date && date.year) {
		year = String(date.year).padStart(4, '0');
		if (date.month) {
			month = String(date.month).padStart(2, '0');
		}
	}
	return year + '.' + month + '.' + day;
}


function formatVariant(variant) {
	if (variant === 'regular') {
		return undefined;
	}
	else if (variant === 'chess960') {
		return 'Fischerandom';
	}
	else if (variant === 'antichess') {
		return 'Antichess';
	}
	else {
		return variant;
	}
}


function writeOptionalHeader(key, value) {
	if (value !== undefined) {
		value = impl.trimAndCollapseSpaces(value);
	}
	return value ? '[' + key + ' "' + escapeHeaderValue(impl.trimAndCollapseSpaces(value)) + '"]\n' : '';
}


function writeAnnotations(node, pushToken) {

	// NAGs
	var nags = node.nags();
	for (var k = 0; k < nags.length; ++k) {
		pushToken('$' + nags[k]);
	}

	// Prepare comment
	var comment = node.comment();
	if (comment) {
		comment = impl.trimAndCollapseSpaces(comment);
	}

	// Prepare tags
	var tags = node.tags();
	var nonEmptyTagFound = false;
	var tagValues = {};
	for (var k = 0; k < tags.length; ++k) {
		var tag = tags[k];
		var tagValue = impl.trimAndCollapseSpaces(node.tag(tag));
		if (tagValue) {
			tagValues[tag] = tagValue;
			nonEmptyTagFound = true;
		}
	}

	// Tags & comments
	if (nonEmptyTagFound || comment) {
		pushToken('{');
		for (var k = 0; k < tags.length; ++k) {
			var tag = tags[k];
			var tagValue = tagValues[tag];
			if (tagValue) {
				pushToken('[%' + tag + ' ' + escapeCommentValue(tagValue) + ']'); // TODO escape issue
			}
		}
		if (comment) {
			escapeCommentValue(comment).split(' ').forEach(pushToken);
		}
		pushToken('}');
		return true;
	}
	else {
		return false;
	}
}


function writeNode(node, forceMoveNumber, pushToken) {

	if (node.moveColor() === 'w') {
		pushToken(node.fullMoveNumber() + '.');
	}
	else if (forceMoveNumber) {
		pushToken(node.fullMoveNumber() + '...');
	}

	pushToken(node.notation());
	var nextForceMoveNumber = writeAnnotations(node, pushToken);

	var variations = node.variations();
	for (var k = 0; k < variations.length; ++k) {
		var variation = variations[k];
		if (variation.first()) {
			pushToken('(');
			writeVariation(variation, pushToken);
			pushToken(')');
			nextForceMoveNumber = true;
		}
	}

	return nextForceMoveNumber;
}


function writeVariation(variation, pushToken) {
	writeAnnotations(variation, pushToken);

	var currentNode = variation.first();
	var forceMoveNumber = true;
	while (currentNode) {
		forceMoveNumber = writeNode(currentNode, forceMoveNumber, pushToken);
		currentNode = currentNode.next();
	}
}


function writeGame(game) {
	var result = '';

	// Mandatory tags
	result += '[Event "' + formatNullableHeader(game.event()) + '"]\n';
	result += '[Site "' + formatNullableHeader(game.site()) + '"]\n';
	result += '[Date "' + formatDateHeader(game.date()) + '"]\n';
	result += '[Round "' + formatNullableHeader(game.round()) + '"]\n';
	result += '[White "' + formatNullableHeader(game.playerName('w')) + '"]\n';
	result += '[Black "' + formatNullableHeader(game.playerName('b')) + '"]\n';
	result += '[Result "' + game.result() + '"]\n';

	var variant = game.variant();
	var hasFENHeader = !bt.variantWithCanonicalStartPosition(bt.variantFromString(variant)) || game._initialPosition.fen() !== new Position(variant).fen();

	// Additional tags (ASCII order by tag name)
	result += writeOptionalHeader('Annotator', game.annotator());
	result += writeOptionalHeader('BlackElo', game.playerElo('b'));
	result += writeOptionalHeader('BlackTitle', game.playerTitle('b'));
	if (hasFENHeader) {
		result += '[FEN "' + game.initialPosition().fen({ fullMoveNumber: game.mainVariation().initialFullMoveNumber() }) + '"]\n'; // TODO avoid X-FEN if possible
		result += '[SetUp "1"]\n';
	}
	result += writeOptionalHeader('Variant', formatVariant(variant));
	result += writeOptionalHeader('WhiteElo', game.playerElo('w'));
	result += writeOptionalHeader('WhiteTitle', game.playerTitle('w'));

	// Separator
	result += '\n';

	// Movetext
	var currentLine = '';
	function pushToken(token) {
		if (currentLine.length === 0) {
			currentLine = token;
		}
		else if (currentLine.length + token.length + 1 <= 80) {
			currentLine += ' ' + token;
		}
		else {
			result += currentLine + '\n';
			currentLine = token;
		}
	}

	writeVariation(game.mainVariation(), pushToken);
	pushToken(game.result());
	result += currentLine + '\n'; // currentLine is always non-empty here

	return result;
}


/**
 * Generate the PGN string corresponding to the given array of {@link Game} objects.
 */
exports.writeGames = function(games) {
	return games.map(writeGame).join('\n');
};
