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


import { Color, GameResult, GameVariant } from './base_types';
import { DateValue } from './date_value';
import { IllegalArgument } from './exception';
import { nagSymbol, variantWithCanonicalStartPosition } from './helper';
import { AbstractNode, Node, Variation } from './node_variation';
import { Position } from './position';

import { trimAndCollapseSpaces } from './private_game/common';
import { MoveTreeRoot } from './private_game/node_variation_impl';

import { ColorImpl, colorFromString, LINE, resultFromString, resultToString } from './private_position/base_types_impl';


/**
 * Chess game, with the move history, the position at each step of the game, the comments and annotations (if any),
 * the result of the game, and some meta-data such as the name of the players, the date of the game, the name of the tournament, etc...
 */
export class Game {

	// Headers
	private _playerName: (string | undefined)[];
	private _playerElo: (string | undefined)[];
	private _playerTitle: (string | undefined)[];
	private _event?: string;
	private _round?: string;
	private _date?: DateValue;
	private _site?: string;
	private _annotator?: string;
	private _result: number;

	// Moves
	private _moveTreeRoot: MoveTreeRoot;


	constructor() {
		this._playerName = [ undefined, undefined ];
		this._playerElo = [ undefined, undefined ];
		this._playerTitle = [ undefined, undefined ];
		this._result = LINE;
		this._moveTreeRoot = new MoveTreeRoot();
	}


	/**
	 * Get the name of the player corresponding to the given color.
	 */
	playerName(color: Color): string | undefined;

	/**
	 * Set the name of the player corresponding to the given color.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	playerName(color: Color, value: string | undefined): void;

	playerName(color: Color, value?: string | undefined) {
		const colorCode = colorFromString(color);
		if (colorCode < 0) {
			throw new IllegalArgument('Game.playerName()');
		}
		if (arguments.length === 1) {
			return this._playerName[colorCode];
		}
		else {
			this._playerName[colorCode] = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the elo of the player corresponding to the given color.
	 */
	playerElo(color: Color): string | undefined;

	/**
	 * Set the elo of the player corresponding to the given color.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	playerElo(color: Color, value: string | undefined): void;

	playerElo(color: Color, value?: string | undefined) {
		const colorCode = colorFromString(color);
		if (colorCode < 0) {
			throw new IllegalArgument('Game.playerElo()');
		}
		if (arguments.length === 1) {
			return this._playerElo[colorCode];
		}
		else {
			this._playerElo[colorCode] = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the title of the player corresponding to the given color.
	 */
	playerTitle(color: Color): string | undefined;

	/**
	 * Set the title of the player corresponding to the given color.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	playerTitle(color: Color, value: string | undefined): void;

	playerTitle(color: Color, value?: string | undefined) {
		const colorCode = colorFromString(color);
		if (colorCode < 0) {
			throw new IllegalArgument('Game.playerTitle()');
		}
		if (arguments.length === 1) {
			return this._playerTitle[colorCode];
		}
		else {
			this._playerTitle[colorCode] = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the event.
	 */
	event(): string | undefined;

	/**
	 * Set the event.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	event(value: string | undefined): void;

	event(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._event;
		}
		else {
			this._event = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the round.
	 */
	round(): string | undefined;

	/**
	 * Set the round.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	round(value: string | undefined): void;

	round(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._round;
		}
		else {
			this._round = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the date of the game.
	 */
	date(): DateValue | undefined;

	/**
	 * Set the date of the game.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	date(value: DateValue | Date | undefined): void;

	/**
	 * Set the date of the game.
	 */
	date(year: number, month?: number, day?: number): void;

	date(valueOrYear?: DateValue | Date | undefined | number, month?: number, day?: number) {
		if (arguments.length === 0) {
			return this._date;
		}
		else if (valueOrYear === undefined || valueOrYear === null) {
			this._date = undefined;
		}
		else if (valueOrYear instanceof DateValue) {
			this._date = valueOrYear;
		}
		else if (valueOrYear instanceof Date) {
			this._date = new DateValue(valueOrYear);
		}
		else if (typeof valueOrYear === 'number' && DateValue.isValid(valueOrYear, month, day)) {
			this._date = new DateValue(valueOrYear, month, day);
		}
		else {
			throw new IllegalArgument('Game.date()');
		}
	}


	/**
	 * Get the date of the game as a standard JavaScript `Date` object.
	 */
	dateAsDate(): Date | undefined {
		return this._date === undefined ? undefined : this._date.toDate();
	}


	/**
	 * Get the date of the game as a human-readable string (e.g. `'November 1955'`, `'September 4, 2021'`).
	 *
	 * @param locales - Locales to use to generate the result. If undefined, the default locale of the execution environment is used.
	 *                  See [Intl documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
	 *                  for more details.
	 */
	dateAsString(locales?: string | string[] | undefined): string | undefined {
		return this._date === undefined ? undefined : this._date.toHumanReadableString(locales);
	}


	/**
	 * Get where the game takes place.
	 */
	site(): string | undefined;

	/**
	 * Set where the game takes place.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	site(value: string | undefined): void;

	site(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._site;
		}
		else {
			this._site = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the name of the annotator.
	 */
	annotator(): string | undefined;

	/**
	 * Set the name of the annotator.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	annotator(value: string | undefined): void;

	annotator(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._annotator;
		}
		else {
			this._annotator = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the result of the game.
	 */
	result(): GameResult;

	/**
	 * Set the result of the game.
	 */
	result(value: GameResult): void;

	result(value?: GameResult) {
		if (arguments.length === 0) {
			return resultToString(this._result);
		}
		else {
			const resultCode = resultFromString(value);
			if (resultCode < 0) {
				throw new IllegalArgument('Game.result()');
			}
			this._result = resultCode;
		}
	}


	/**
	 * Get the chess game variant of the game.
	 */
	variant(): GameVariant {
		return this._moveTreeRoot._position.variant();
	}

	/**
	 * Get the initial position of the game.
	 */
	initialPosition(): Position;

	/**
	 * Set the initial position of the game.
	 *
	 * @param fullMoveNumber - 1 by default
	 */
	initialPosition(initialPosition: Position, fullMoveNumber?: number): void;

	initialPosition(initialPosition?: Position, fullMoveNumber?: number) {
		if (arguments.length === 0) {
			return new Position(this._moveTreeRoot._position);
		}
		else {
			if (!(initialPosition instanceof Position)) {
				throw new IllegalArgument('Game.initialPosition()');
			}
			if (arguments.length >= 2) {
				if (!Number.isInteger(fullMoveNumber)) {
					throw new IllegalArgument('Game.initialPosition()');
				}
				this._moveTreeRoot._fullMoveNumber = fullMoveNumber!;
			}
			else {
				this._moveTreeRoot._fullMoveNumber = 1;
			}
			this._moveTreeRoot._position = new Position(initialPosition);
			this._moveTreeRoot.clearTree();
		}
	}


	/**
	 * The main variation of the game.
	 */
	mainVariation(): Variation {
		return this._moveTreeRoot.mainVariation();
	}


	/**
	 * Return the nodes corresponding to the moves of the main variation.
	 *
	 * @param withSubVariations - If `true`, the nodes of the sub-variations are also included in the result.
	 */
	nodes(withSubVariations = false): Node[] {
		if (!withSubVariations) {
			return this.mainVariation().nodes();
		}
	
		const result: Node[] = [];
		function processVariation(variation: Variation) {
			for (const currentNode of variation.nodes()) {
				for (const nextVariation of currentNode.variations()) {
					processVariation(nextVariation);
				}
				result.push(currentNode);
			}
		}
		processVariation(this.mainVariation());
		return result;
	}


	/**
	 * Return the node or variation corresponding to the given ID (see {@link Node.id} and {@link Variation.id}
	 * to retrieve the ID of a node or variation).
	 *
	 * @returns `undefined` if the given ID does not correspond to an existing {@link Node} and {@link Variation}.
	 */
	findById(id: string): Node | Variation | undefined {
		return this._moveTreeRoot.findById(id);
	}


	/**
	 * Return a human-readable string representing the game. This string is multi-line,
	 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
	 */
	ascii(): string {
		const lines: string[] = [];
		function pushIfDefined(header: string | undefined) {
			if (header !== undefined) {
				lines.push(header);
			}
		}

		// Headers
		pushIfDefined(formatEventAndRound(this._event, this._round));
		pushIfDefined(formatSimpleHeader('Site', this._site));
		pushIfDefined(formatDate(this.dateAsString('en-us')));
		pushIfDefined(formatPlayer('White', this._playerName[ColorImpl.WHITE], this._playerElo[ColorImpl.WHITE], this._playerTitle[ColorImpl.WHITE]));
		pushIfDefined(formatPlayer('Black', this._playerName[ColorImpl.BLACK], this._playerElo[ColorImpl.BLACK], this._playerTitle[ColorImpl.BLACK]));
		pushIfDefined(formatSimpleHeader('Annotator', this._annotator));

		// Variant & initial position
		const variant = this._moveTreeRoot._position.variant();
		if (variant !== 'regular') {
			lines.push('Variant: ' + variant);
		}
		if (!variantWithCanonicalStartPosition(variant) || !Position.isEqual(this._moveTreeRoot._position, new Position(variant))) {
			lines.push(this._moveTreeRoot._position.ascii());
		}

		// Moves & result

		function isNonEmptyVariation(variation: Variation) {
			return variation.first() !== undefined || variation.nags().length > 0 || variation.tags().length > 0 || variation.comment() !== undefined;
		}

		function dumpNode(node: Node, indent: string, hasSomethingAfter: boolean) {

			// Describe the move
			const move = indent + node.fullMoveNumber() + (node.moveColor() === 'w' ? '.' : '...') + node.notation();
			const moveAnnotations = formatAnnotations(node);
			lines.push(moveAnnotations.length === 0 ? move : move + ' ' + moveAnnotations.join(' '));

			// Print the sub-variations
			let atLeastOneNonEmptyVariation = false;
			for (const variation of node.variations()) {
				if (isNonEmptyVariation(variation)) {
					lines.push(indent + ' |');
					dumpVariation(variation, indent + (hasSomethingAfter ? ' |  ' : '    '), indent + ' +- ', false);
					atLeastOneNonEmptyVariation = true;
				}
			}
			return atLeastOneNonEmptyVariation;
		}

		function dumpVariation(variation: Variation, indent: string, indentFirst: string, hasSomethingAfter: boolean) {

			// Variation annotations
			const variationAnnotations = formatAnnotations(variation);
			if (variationAnnotations.length > 0) {
				lines.push(indentFirst + variationAnnotations.join(' '));
			}

			// List of moves
			let node = variation.first();
			let atLeastOneVariationInPreviousNode = false;
			let isFirstNode = true;
			while (node !== undefined) {
				if (atLeastOneVariationInPreviousNode) {
					lines.push(indent + ' |');
				}
				const nextNode = node.next();
				atLeastOneVariationInPreviousNode = dumpNode(node, isFirstNode && variationAnnotations.length === 0 ? indentFirst : indent, hasSomethingAfter || nextNode !== undefined);
				isFirstNode = false;
				node = nextNode;
			}
		}

		dumpVariation(this._moveTreeRoot.mainVariation(), '', '', false);
		lines.push(resultToString(this._result));

		return lines.join('\n');
	}

}


function sanitizeStringHeader(value: any) {
	return value === undefined || value === null ? undefined : String(value);
}


function trimCollapseAndMarkEmpty(text: string) {
	text = trimAndCollapseSpaces(text);
	return text === '' ? '<empty>' : text;
}


function formatSimpleHeader(key: string, header: string | undefined) {
	return header === undefined ? undefined : `${key}: ${trimCollapseAndMarkEmpty(header)}`;
}


function formatEventAndRound(event: string | undefined, round: string | undefined) {
	if (event === undefined && round === undefined) {
		return undefined;
	}
	let result = event === undefined ? 'Event: <undefined>' : `Event: ${trimCollapseAndMarkEmpty(event)}`;
	if (round !== undefined) {
		result += ` (${trimCollapseAndMarkEmpty(round)})`;
	}
	return result;
}


function formatDate(dateAsString: string | undefined) {
	return dateAsString === undefined ? undefined : 'Date: ' + dateAsString;
}


function formatPlayer(key: string, playerName: string | undefined, playerElo: string | undefined, playerTitle: string | undefined) {
	if (playerName === undefined && playerElo === undefined && playerTitle === undefined) {
		return undefined;
	}
	let result = playerName === undefined ? `${key}: <undefined>` : `${key}: ${trimCollapseAndMarkEmpty(playerName)}`;
	if (playerElo !== undefined && playerTitle !== undefined) {
		result += ` (${trimCollapseAndMarkEmpty(playerTitle)} ${trimCollapseAndMarkEmpty(playerElo)})`;
	}
	else if (playerElo !== undefined) {
		result += ` (${trimCollapseAndMarkEmpty(playerElo)})`;
	}
	else if (playerTitle !== undefined) {
		result +=  ` (${trimCollapseAndMarkEmpty(playerTitle)})`;
	}
	return result;
}


function formatAnnotations(node: AbstractNode) {
	const result: string[] = [];

	// NAGs
	for (const nag of node.nags()) {
		result.push(nagSymbol(nag));
	}

	// Tags
	for (const tagKey of node.tags()) {
		result.push(`${tagKey}={${trimAndCollapseSpaces(node.tag(tagKey)!)}}`);
	}

	// Comment
	const comment = node.comment();
	if (comment !== undefined) {
		result.push(trimCollapseAndMarkEmpty(comment));
	}

	return result;
}
