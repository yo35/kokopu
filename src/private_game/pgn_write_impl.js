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


function escapeHeaderValue(value) {
	return value.replace(/([\\"])/g, '\\$1');
}


function escapeCommentValue(value) {
	return value.replace(/([\\}])/g, '\\$1');
}


function formatNullableHeader(value) {
	if (value !== undefined) {
		value = common.trimAndCollapseSpaces(value);
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
	else if (variant === 'horde') {
		return 'Horde';
	}
	else {
		return variant;
	}
}


function writeOptionalHeader(key, value) {
	if (value !== undefined) {
		value = common.trimAndCollapseSpaces(value);
	}
	return value ? '[' + key + ' "' + escapeHeaderValue(value) + '"]\n' : '';
}


function writeAnnotations(node, pushToken, skipLine, isHeaderAnnotationOfMainVariation) {

	// NAGs
	var nags = node.nags();
	for (var k = 0; k < nags.length; ++k) {
		pushToken('$' + nags[k], false, false);
	}

	// Prepare comment
	var comment = node.comment();
	if (comment) {
		comment = common.trimAndCollapseSpaces(comment);
	}

	// Prepare tags
	var tags = node.tags();
	var nonEmptyTagFound = false;
	var tagValues = {};
	for (var k = 0; k < tags.length; ++k) {
		var tag = tags[k];
		var tagValue = common.trimAndCollapseSpaces(node.tag(tag).replace(/[[\]]/g, '')); // Square-brackets are erased in tag values in PGN.
		if (tagValue) {
			tagValues[tag] = tagValue;
			nonEmptyTagFound = true;
		}
	}

	// Tags & comments
	if (nonEmptyTagFound || comment) {
		if (comment && node.isLongComment() && !isHeaderAnnotationOfMainVariation) {
			skipLine();
		}
		pushToken('{', false, true);
		for (var k = 0; k < tags.length; ++k) {
			var tag = tags[k];
			var tagValue = tagValues[tag];
			if (tagValue) {
				pushToken('[%' + tag, false, false);
				escapeCommentValue(tagValue + ']').split(' ').forEach(function(token) {
					pushToken(token, false, false);
				});
			}
		}
		if (comment) {
			escapeCommentValue(comment).split(' ').forEach(function(token) {
				pushToken(token, false, false);
			});
		}
		pushToken('}', true, false);
		return true;
	}
	else {
		return false;
	}
}


function writeNode(node, forceMoveNumber, pushToken, skipLine) {

	if (node.moveColor() === 'w') {
		pushToken(node.fullMoveNumber() + '.', false, false);
	}
	else if (forceMoveNumber) {
		pushToken(node.fullMoveNumber() + '...', false, false);
	}

	pushToken(node.notation(), false, false);
	var nextForceMoveNumber = writeAnnotations(node, pushToken, skipLine, false);

	var variations = node.variations();
	for (var k = 0; k < variations.length; ++k) {
		var variation = variations[k];
		if (!variation.first()) {
			continue;
		}
		if (variation.isLongVariation()) {
			skipLine();
		}
		pushToken('(', false, true);
		writeVariation(variation, pushToken, skipLine, false);
		pushToken(')', true, false);
		nextForceMoveNumber = true;
	}

	return nextForceMoveNumber;
}


function writeVariation(variation, pushToken, skipLine, isMainVariation) {
	writeAnnotations(variation, pushToken, skipLine, isMainVariation);

	var currentNode = variation.first();
	var forceMoveNumber = true;
	while (currentNode) {
		forceMoveNumber = writeNode(currentNode, forceMoveNumber, pushToken, skipLine);
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
	var hasFENHeader = !helper.variantWithCanonicalStartPosition(variant) || game._initialPosition.fen() !== new Position(variant).fen();

	// Additional tags (ASCII order by tag name)
	result += writeOptionalHeader('Annotator', game.annotator());
	result += writeOptionalHeader('BlackElo', game.playerElo('b'));
	result += writeOptionalHeader('BlackTitle', game.playerTitle('b'));
	if (hasFENHeader) {
		result += '[FEN "' + game.initialPosition().fen({ fullMoveNumber: game.mainVariation().initialFullMoveNumber(), regularFENIfPossible: true }) + '"]\n';
		result += '[SetUp "1"]\n';
	}
	result += writeOptionalHeader('Variant', formatVariant(variant));
	result += writeOptionalHeader('WhiteElo', game.playerElo('w'));
	result += writeOptionalHeader('WhiteTitle', game.playerTitle('w'));

	// Separator
	result += '\n';

	// Movetext
	// --------

	var currentLine = '';
	var avoidNextSpace = false;

	function pushToken(token, avoidSpaceBefore, avoidSpaceAfter) {
		if (currentLine.length === 0) {
			currentLine = token;
		}
		else if (currentLine.length + token.length + (avoidNextSpace || avoidSpaceBefore ? 0 : 1) <= 80) {
			currentLine += (avoidNextSpace || avoidSpaceBefore ? '' : ' ') + token;
		}
		else {
			result += currentLine + '\n';
			currentLine = token;
		}
		avoidNextSpace = avoidSpaceAfter;
	}

	function skipLine() {
		result += currentLine + '\n'; // `currentLine` is always non-empty since there is never two consecutive calls to `skipLine()`
		result += '\n';
		currentLine = '';
		avoidNextSpace = false;
	}

	writeVariation(game.mainVariation(), pushToken, skipLine, true);
	pushToken(game.result(), false, false);
	result += currentLine + '\n'; // `currentLine` is non-empty here

	return result;
}


/**
 * Generate the PGN string corresponding to the given array of {@link Game} objects.
 */
exports.writeGames = function(games) {
	return games.map(writeGame).join('\n');
};
