/* -------------------------------------------------------------------------- *
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
 * -------------------------------------------------------------------------- */


import { GameVariant } from '../base_types';
import { DateValue } from '../date_value';
import { Game } from '../game';
import { variantWithCanonicalStartPosition } from '../helper';
import { AbstractNode, Node, Variation } from '../node_variation';
import { Position } from '../position';

import { trimAndCollapseSpaces } from '../private_game/common';


function escapeHeaderValue(value: string) {
	return value.replace(/([\\"])/g, '\\$1');
}


function escapeCommentValue(value: string) {
	return value.replace(/([\\}])/g, '\\$1');
}


function formatNullableHeader(value: string | undefined) {
	if (value !== undefined) {
		value = trimAndCollapseSpaces(value);
	}
	return value ? escapeHeaderValue(value) : '?';
}


function formatDateHeader(date: DateValue | undefined) {
	return date === undefined ? '????.??.??' : date.toPGNString();
}


function formatVariant(variant: GameVariant) {
	switch (variant) {
		case 'regular': return undefined;
		case 'chess960': return 'Fischerandom';
		case 'antichess': return 'Antichess';
		case 'horde': return 'Horde';
		default: return variant;
	}
}


function writeOptionalHeader(key: string, value: string | undefined) {
	if (value !== undefined) {
		value = trimAndCollapseSpaces(value);
	}
	return value ? `[${key} "${escapeHeaderValue(value)}"]\n` : '';
}


function writeOptionalIntegerHeader(key: string, value: number | undefined) {
	return value === undefined ? '' : `[${key} "${value}"]\n`;
}


/**
 * @returns `true` if the move number of the next move must be written.
 */
function writeAnnotations(node: AbstractNode, skipLineAfterCommentIfLong: boolean,
	pushToken: (token: string, avoidSpaceBefore: boolean, avoidSpaceAfter: boolean) => void, skipLine: () => void): boolean {

	// NAGs
	for (const nag of node.nags()) {
		pushToken('$' + nag, false, false);
	}

	// Prepare comment
	let comment = node.comment();
	if (comment !== undefined) {
		comment = trimAndCollapseSpaces(comment);
	}

	// Prepare tags
	const tags = node.tags();
	const tagValues: Map<string, string> = new Map();
	let nonEmptyTagFound = false;
	for (const tagKey of tags) {
		const tagValue = trimAndCollapseSpaces(node.tag(tagKey)!.replace(/[[\]]/g, '')); // Square-brackets are erased in tag values in PGN.
		if (tagValue) {
			tagValues.set(tagKey, tagValue);
			nonEmptyTagFound = true;
		}
	}

	// Tags & comments
	if (nonEmptyTagFound || comment) {
		if (comment && node.isLongComment() && node instanceof Node) {
			skipLine();
		}
		pushToken('{', false, true);
		for (const tagKey of tags) {
			const tagValue = tagValues.get(tagKey);
			if (tagValue) {
				pushToken('[%' + tagKey, false, false);
				for (const token of escapeCommentValue(tagValue + ']').split(' ')) {
					pushToken(token, false, false);
				}
			}
		}
		if (comment) {
			for (const token of escapeCommentValue(comment).split(' ')) {
				pushToken(token, false, false);
			}
		}
		pushToken('}', true, false);
		if (comment && node.isLongComment() && skipLineAfterCommentIfLong) {
			skipLine();
		}
		return true;
	}
	else {
		return false;
	}
}


/**
 * @returns `true` if the move number of the next move must be written.
 */
function writeNode(node: Node, forceMoveNumber: boolean, isMainVariation: boolean,
	pushToken: (token: string, avoidSpaceBefore: boolean, avoidSpaceAfter: boolean) => void, skipLine: () => void): boolean {

	if (node.moveColor() === 'w') {
		pushToken(node.fullMoveNumber() + '.', false, false);
	}
	else if (forceMoveNumber) {
		pushToken(node.fullMoveNumber() + '...', false, false);
	}

	pushToken(node.notation(), false, false);

	const variations = node.variations();
	let lastNonEmptyVariationIndex = -1;
	for (let k = variations.length - 1; k >= 0; --k) {
		if (variations[k].first() !== undefined) {
			lastNonEmptyVariationIndex = k;
			break;
		}
	}

	let nextForceMoveNumber = writeAnnotations(node, (isMainVariation || node.next() !== undefined) && lastNonEmptyVariationIndex < 0, pushToken, skipLine);

	for (let k = 0; k < variations.length; ++k) {
		const variation = variations[k];
		if (variation.first() === undefined) {
			continue;
		}
		if (variation.isLongVariation()) {
			skipLine();
		}
		pushToken('(', false, true);
		writeVariation(variation, false, pushToken, skipLine);
		pushToken(')', true, false);
		if (k === lastNonEmptyVariationIndex && variation.isLongVariation()) {
			skipLine();
		}
		nextForceMoveNumber = true;
	}

	return nextForceMoveNumber;
}


function writeVariation(variation: Variation, isMainVariation: boolean,
	pushToken: (token: string, avoidSpaceBefore: boolean, avoidSpaceAfter: boolean) => void, skipLine: () => void): void {

	writeAnnotations(variation, true, pushToken, skipLine);

	let currentNode = variation.first();
	let forceMoveNumber = true;
	while (currentNode !== undefined) {
		forceMoveNumber = writeNode(currentNode, forceMoveNumber, isMainVariation, pushToken, skipLine);
		currentNode = currentNode.next();
	}
}


/**
 * Options for the {@link pgnWrite} methods.
 */
export interface PGNWriteOptions {

	/**
	 * If `true`, a PGN tag `[PlyCount "..."]` corresponding to the number of half-moves is added to each game in the generated PGN string. `false` by default.
	 */
	withPlyCount?: boolean;
}


/**
 * Generate the PGN string corresponding to the given {@link Game} object.
 */
export function writeGame(game: Game, options: PGNWriteOptions) {
	let result = '';

	// Mandatory tags
	result += `[Event "${formatNullableHeader(game.event())}"]\n`;
	result += `[Site "${formatNullableHeader(game.site())}"]\n`;
	result += `[Date "${formatDateHeader(game.date())}"]\n`;
	result += `[Round "${formatNullableHeader(game.round())}"]\n`;
	result += `[White "${formatNullableHeader(game.playerName('w'))}"]\n`;
	result += `[Black "${formatNullableHeader(game.playerName('b'))}"]\n`;
	result += `[Result "${game.result()}"]\n`;

	const variant = game.variant();
	const initialPosition = game.initialPosition();
	const hasFENHeader = !variantWithCanonicalStartPosition(variant) || !Position.isEqual(initialPosition, new Position(variant))
		|| game.initialFullMoveNumber() !== 1;

	// Additional tags (ASCII order by tag name)
	result += writeOptionalHeader('Annotator', game.annotator());
	result += writeOptionalIntegerHeader('BlackElo', game.playerElo('b'));
	result += writeOptionalHeader('BlackTitle', game.playerTitle('b'));
	result += writeOptionalHeader('ECO', game.eco());
	if (hasFENHeader) {
		result += `[FEN "${initialPosition.fen({ fullMoveNumber: game.initialFullMoveNumber(), regularFENIfPossible: true })}"]\n`;
	}
	result += writeOptionalHeader('Opening', game.opening());
	if (options.withPlyCount) {
		result += `[PlyCount "${game.plyCount()}"]\n`;
	}
	if (hasFENHeader) {
		result += '[SetUp "1"]\n';
	}
	result += writeOptionalHeader('SubVariation', game.openingSubVariation());
	result += writeOptionalHeader('Termination', game.termination());
	result += writeOptionalHeader('Variant', formatVariant(variant));
	result += writeOptionalHeader('Variation', game.openingVariation());
	result += writeOptionalIntegerHeader('WhiteElo', game.playerElo('w'));
	result += writeOptionalHeader('WhiteTitle', game.playerTitle('w'));

	// Separator
	result += '\n';

	// Movetext
	// --------

	let currentLine = '';
	let avoidNextSpace = false;

	function pushToken(token: string, avoidSpaceBefore: boolean, avoidSpaceAfter: boolean) {
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

	writeVariation(game.mainVariation(), true, pushToken, skipLine);
	pushToken(game.result(), false, false);
	result += currentLine + '\n'; // `currentLine` is non-empty here

	return result;
}


/**
 * Generate the PGN string corresponding to the given array of {@link Game} objects.
 */
export function writeGames(games: Game[], options: PGNWriteOptions) {
	return games.map(game => writeGame(game, options)).join('\n\n');
}
