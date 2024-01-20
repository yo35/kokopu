/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2024  Yoann Le Montagner <yo35 -at- melix.net>       *
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


import { Color, GameResult, GameVariant } from './base_types';
import { DateValue } from './date_value';
import { IllegalArgument, InvalidPOJO } from './exception';
import { GamePOJO, PlayerPOJO } from './game_pojo';
import { isValidECO, nagSymbol, variantWithCanonicalStartPosition } from './helper';
import { i18n } from './i18n';
import { AbstractNode, Node, Variation } from './node_variation';
import { Position } from './position';

import { trimAndCollapseSpaces, isValidElo, isValidRound } from './private_game/common';
import { MoveTreeRoot } from './private_game/node_variation_impl';
import { POJOExceptionBuilder, decodeStringField, decodeNumberField, decodeObjectField } from './private_game/pojo_util';

import { ColorImpl, GameResultImpl, colorFromString, resultFromString, resultToString } from './private_position/base_types_impl';


const enum RoundPart {
	ROUND,
	SUB_ROUND,
	SUB_SUB_ROUND,
}


/**
 * Chess game, with the move history, the position at each step of the game, the comments and annotations (if any),
 * the result of the game, and some meta-data such as the name of the players, the date of the game, the name of the tournament, etc...
 */
export class Game {

	// Headers
	private _playerName: [ string | undefined, string | undefined ];
	private _playerElo: [ number | undefined, number | undefined ];
	private _playerTitle: [ string | undefined, string | undefined ];
	private _event?: string;
	private _round: [ number | undefined, number | undefined, number | undefined ];
	private _date?: DateValue;
	private _site?: string;
	private _annotator?: string;
	private _eco?: string;
	private _opening?: string;
	private _openingVariation?: string;
	private _openingSubVariation?: string;
	private _termination?: string;
	private _result: GameResultImpl;

	// Moves
	private _moveTreeRoot: MoveTreeRoot;


	constructor() {
		this._playerName = [ undefined, undefined ];
		this._playerElo = [ undefined, undefined ];
		this._playerTitle = [ undefined, undefined ];
		this._round = [ undefined, undefined, undefined ];
		this._result = GameResultImpl.LINE;
		this._moveTreeRoot = new MoveTreeRoot();
	}


	/**
	 * Clear all the headers (player names, elos, titles, event name, date, etc...).
	 *
	 * The {@link Game.result} header is reseted to its default value.
	 * The initial position and moves are not modified.
	 */
	clearHeaders(): void {
		this._playerName = [ undefined, undefined ];
		this._playerElo = [ undefined, undefined ];
		this._playerTitle = [ undefined, undefined ];
		this._event = undefined;
		this._round = [ undefined, undefined, undefined ];
		this._date = undefined;
		this._site = undefined;
		this._annotator = undefined;
		this._eco = undefined;
		this._opening = undefined;
		this._openingVariation = undefined;
		this._openingSubVariation = undefined;
		this._termination = undefined;
		this._result = GameResultImpl.LINE;
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
	 *
	 * If defined, the returned value is guaranteed to be an integer >= 0.
	 */
	playerElo(color: Color): number | undefined;

	/**
	 * Set the elo of the player corresponding to the given color.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased. Must be an integer >= 0.
	 */
	playerElo(color: Color, value: number | undefined): void;

	playerElo(color: Color, value?: number | undefined) {
		const colorCode = colorFromString(color);
		if (colorCode < 0) {
			throw new IllegalArgument('Game.playerElo()');
		}
		if (arguments.length === 1) {
			return this._playerElo[colorCode];
		}
		else {
			value = sanitizeNumberHeader(value);
			if (value === undefined || isValidElo(value)) {
				this._playerElo[colorCode] = value;
			}
			else {
				throw new IllegalArgument('Game.playerElo()');
			}
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
	round(): number | undefined;

	/**
	 * Set the round.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased. Must be an integer >= 0.
	 */
	round(value: number | undefined): void;

	round(value?: number | undefined) {
		if (arguments.length === 0) {
			return this._round[RoundPart.ROUND];
		}
		else {
			this._setRoundPart(RoundPart.ROUND, value, 'Game.round()');
		}
	}


	/**
	 * Get the sub-round.
	 */
	subRound(): number | undefined;

	/**
	 * Set the sub-round.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased. Must be an integer >= 0.
	 */
	subRound(value: number | undefined): void;

	subRound(value?: number | undefined) {
		if (arguments.length === 0) {
			return this._round[RoundPart.SUB_ROUND];
		}
		else {
			this._setRoundPart(RoundPart.SUB_ROUND, value, 'Game.subRound()');
		}
	}


	/**
	 * Get the sub-sub-round.
	 */
	subSubRound(): number | undefined;

	/**
	 * Set the sub-sub-round.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased. Must be an integer >= 0.
	 */
	subSubRound(value: number | undefined): void;

	subSubRound(value?: number | undefined) {
		if (arguments.length === 0) {
			return this._round[RoundPart.SUB_SUB_ROUND];
		}
		else {
			this._setRoundPart(RoundPart.SUB_SUB_ROUND, value, 'Game.subSubRound()');
		}
	}


	private _setRoundPart(roundPart: RoundPart, value: number | undefined, methodName: string) {
		value = sanitizeNumberHeader(value);
		if (value === undefined || isValidRound(value)) {
			this._round[roundPart] = value;
		}
		else {
			throw new IllegalArgument(methodName);
		}
	}


	/**
	 * Get the round, sub-round and sub-sub-round as a human-readable string, the 3 components being separated by dot characters.
	 */
	fullRound(): string | undefined {
		return formatFullRound(this._round[RoundPart.ROUND], this._round[RoundPart.SUB_ROUND], this._round[RoundPart.SUB_SUB_ROUND], '?');
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
	 *
	 * If the month and/or the day of month are missing, the date of the game will be partially defined
	 * (see {@link DateValue} for more details regarding partially defined dates).
	 */
	date(year: number, month?: number, day?: number): void;

	date(valueOrYear?: DateValue | Date | undefined | number, month?: number, day?: number) {
		switch (arguments.length) {
			case 0:
				return this._date;

			case 1:
				if (valueOrYear === undefined || valueOrYear === null) {
					this._date = undefined;
				}
				else if (valueOrYear instanceof DateValue) {
					this._date = valueOrYear;
				}
				else if (valueOrYear instanceof Date) {
					this._date = new DateValue(valueOrYear);
				}
				else if (DateValue.isValid(valueOrYear)) {
					this._date = new DateValue(valueOrYear);
				}
				else {
					throw new IllegalArgument('Game.date()');
				}
				break;

			default:
				if (DateValue.isValid(valueOrYear as number, month, day)) {
					this._date = new DateValue(valueOrYear as number, month, day);
				}
				else {
					throw new IllegalArgument('Game.date()');
				}
				break;
		}
	}


	/**
	 * Get the date of the game as a standard JavaScript `Date` object.
	 *
	 * If the day of month is undefined for the current game, the returned `Date` object points at the first day of the corresponding month.
	 * If neither the day of month nor the month are undefined for the current game, the returned `Date` object points at the first day of the corresponding year.
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
	 * Get the [ECO code](https://en.wikipedia.org/wiki/List_of_chess_openings).
	 */
	eco(): string | undefined;

	/**
	 * Set the [ECO code](https://en.wikipedia.org/wiki/List_of_chess_openings).
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased. Must be a valid ECO code (from `'A00'` to `'E99'`).
	 */
	eco(value: string | undefined): void;

	eco(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._eco;
		}
		else {
			value = sanitizeStringHeader(value);
			if (value !== undefined && !isValidECO(value)) {
				throw new IllegalArgument('Game.eco()');
			}
			this._eco = value;
		}
	}


	/**
	 * Get the name of the opening.
	 */
	opening(): string | undefined;

	/**
	 * Set the name of the opening.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	opening(value: string | undefined): void;

	opening(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._opening;
		}
		else {
			this._opening = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the name of the opening variation.
	 */
	openingVariation(): string | undefined;

	/**
	 * Set the name of the opening variation.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	openingVariation(value: string | undefined): void;

	openingVariation(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._openingVariation;
		}
		else {
			this._openingVariation = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the name of the opening sub-variation.
	 */
	openingSubVariation(): string | undefined;

	/**
	 * Set the name of the opening sub-variation.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	openingSubVariation(value: string | undefined): void;

	openingSubVariation(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._openingSubVariation;
		}
		else {
			this._openingSubVariation = sanitizeStringHeader(value);
		}
	}


	/**
	 * Get the reason of the conclusion of the game. Examples of possible values:
	 *
	 * - `'normal'`: game terminated in a normal fashion,
	 * - `'time forfeit'`: loss due to losing player's failure to meet time control requirements,
	 * - `'adjudication'`: result due to third party adjudication process,
	 * - `'death'`: losing player called to greater things, one hopes,
	 * - `'emergency'`: game concluded due to unforeseen circumstances,
	 * - etc...
	 *
	 * This list is not exhaustive and any string is valid value for this field.
	 */
	termination(): string | undefined;

	/**
	 * Set the name of the opening sub-variation.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	termination(value: string | undefined): void;

	termination(value?: string | undefined) {
		if (arguments.length === 0) {
			return this._termination;
		}
		else {
			this._termination = sanitizeStringHeader(value);
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
	 * [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) representation of the chess position at the beginning of the game.
	 *
	 * The fifty-move clock and full-move number are set according to the move history in the string returned by this method.
	 */
	initialFEN(): string {
		return this._moveTreeRoot._position.fen({
			fiftyMoveClock: 0,
			fullMoveNumber: this._moveTreeRoot._fullMoveNumber,
		});
	}


	/**
	 * Full-move number at which the game starts.
	 */
	initialFullMoveNumber(): number {
		return this._moveTreeRoot._fullMoveNumber;
	}


	/**
	 * Chess position at the end of the game.
	 */
	finalPosition(): Position {
		return this._moveTreeRoot.mainVariation().finalPosition();
	}


	/**
	 * [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) representation of the chess position at the end of the game.
	 *
	 * The fifty-move clock and full-move number are set according to the move history in the string returned by this method.
	 */
	finalFEN(): string {
		return this._moveTreeRoot.mainVariation().finalFEN();
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
	 * Number of half-moves in the main variation.
	 *
	 * For instance, after `1.e4 e5 2.Nf3`, the number of half-moves if 3 (2 white moves + 1 black move).
	 */
	plyCount(): number {
		return this._moveTreeRoot.mainVariation().plyCount();
	}


	/**
	 * Return the node or variation corresponding to the given ID (see {@link Node.id | Node.id} and {@link Variation.id | Variation.id}
	 * to retrieve the ID of a node or variation).
	 *
	 * @returns `undefined` if the given ID does not correspond to an existing {@link Node} and {@link Variation}.
	 */
	findById(id: string): Node | Variation | undefined {
		return this._moveTreeRoot.findById(id);
	}


	/**
	 * Return the [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object) representation of the current {@link Game}.
	 * To be used for JSON serialization, deep cloning, etc...
	 */
	pojo(): GamePOJO {

		const pojo: GamePOJO = {};

		function isPlayerPOJOEmpty(game: Game, color: ColorImpl) {
			return game._playerName[color] === undefined && game._playerElo[color] === undefined && game._playerTitle[color] === undefined;
		}

		function getPlayerPOJO(game: Game, color: ColorImpl) {
			const playerPOJO: PlayerPOJO = {};
			if (game._playerName[color] !== undefined) { playerPOJO.name = game._playerName[color]; }
			if (game._playerElo[color] !== undefined) { playerPOJO.elo = game._playerElo[color]; }
			if (game._playerTitle[color] !== undefined) { playerPOJO.title = game._playerTitle[color]; }
			return playerPOJO;
		}

		// Headers
		if (!isPlayerPOJOEmpty(this, ColorImpl.WHITE)) { pojo.white = getPlayerPOJO(this, ColorImpl.WHITE); }
		if (!isPlayerPOJOEmpty(this, ColorImpl.BLACK)) { pojo.black = getPlayerPOJO(this, ColorImpl.BLACK); }
		if (this._event !== undefined) { pojo.event = this._event; }
		if (this._round[RoundPart.ROUND] !== undefined) { pojo.round = this._round[RoundPart.ROUND]; }
		if (this._round[RoundPart.SUB_ROUND] !== undefined) { pojo.subRound = this._round[RoundPart.SUB_ROUND]; }
		if (this._round[RoundPart.SUB_SUB_ROUND] !== undefined) { pojo.subSubRound = this._round[RoundPart.SUB_SUB_ROUND]; }
		if (this._date !== undefined) { pojo.date = this._date.toString(); }
		if (this._site !== undefined) { pojo.site = this._site; }
		if (this._annotator !== undefined) { pojo.annotator = this._annotator; }
		if (this._eco !== undefined) { pojo.eco = this._eco; }
		if (this._opening !== undefined) { pojo.opening = this._opening; }
		if (this._openingVariation !== undefined) { pojo.openingVariation = this._openingVariation; }
		if (this._openingSubVariation !== undefined) { pojo.openingSubVariation = this._openingSubVariation; }
		if (this._termination !== undefined) { pojo.termination = this._termination; }
		if (this._result !== GameResultImpl.LINE) { pojo.result = this.result(); }

		// Moves
		this._moveTreeRoot.getPojo(pojo);

		return pojo;
	}


	/**
	 * Decode the [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object) passed in argument, assuming it follows the schema defined by {@link GamePOJO}.
	 *
	 * @throws {@link exception.InvalidPOJO} if the given object cannot be decoded, either because it does not follow the schema defined by {@link GamePOJO},
	 *         or because it would result in an inconsistent game (e.g. if it contains some invalid moves).
	 */
	static fromPOJO(pojo: unknown): Game {
		if (typeof pojo !== 'object' || pojo === null) {
			throw new InvalidPOJO(pojo, '', i18n.POJO_MUST_BE_AN_OBJECT);
		}

		const game = new Game();
		const exceptionBuilder = new POJOExceptionBuilder(pojo);

		function processPlayerPOJO(playerPOJO: Partial<Record<string, unknown>>, color: ColorImpl) {
			decodeStringField(playerPOJO, 'name', exceptionBuilder, value => { game._playerName[color] = value; });
			decodeNumberField(playerPOJO, 'elo', exceptionBuilder, value => {
				if (!isValidElo(value)) {
					throw exceptionBuilder.build(i18n.INVALID_ELO_IN_POJO);
				}
				game._playerElo[color] = value;
			});
			decodeStringField(playerPOJO, 'title', exceptionBuilder, value => { game._playerTitle[color] = value; });
		}

		function processRoundPart(value: number, roundPart: RoundPart) {
			if (!isValidRound(value)) {
				throw exceptionBuilder.build(i18n.INVALID_ROUND_IN_POJO);
			}
			game._round[roundPart] = value;
		}

		// Headers
		decodeObjectField(pojo, 'white', exceptionBuilder, value => { processPlayerPOJO(value, ColorImpl.WHITE); });
		decodeObjectField(pojo, 'black', exceptionBuilder, value => { processPlayerPOJO(value, ColorImpl.BLACK); });
		decodeStringField(pojo, 'event', exceptionBuilder, value => { game._event = value; });
		decodeNumberField(pojo, 'round', exceptionBuilder, value => { processRoundPart(value, RoundPart.ROUND); });
		decodeNumberField(pojo, 'subRound', exceptionBuilder, value => { processRoundPart(value, RoundPart.SUB_ROUND); });
		decodeNumberField(pojo, 'subSubRound', exceptionBuilder, value => { processRoundPart(value, RoundPart.SUB_SUB_ROUND); });
		decodeStringField(pojo, 'date', exceptionBuilder, value => {
			const date = DateValue.fromString(value);
			if (date === undefined) {
				throw exceptionBuilder.build(i18n.INVALID_DATE_IN_POJO);
			}
			game._date = date;
		});
		decodeStringField(pojo, 'site', exceptionBuilder, value => { game._site = value; });
		decodeStringField(pojo, 'annotator', exceptionBuilder, value => { game._annotator = value; });
		decodeStringField(pojo, 'eco', exceptionBuilder, value => {
			if (!isValidECO(value)) {
				throw exceptionBuilder.build(i18n.INVALID_ECO_CODE_IN_POJO);
			}
			game._eco = value;
		});
		decodeStringField(pojo, 'opening', exceptionBuilder, value => { game._opening = value; });
		decodeStringField(pojo, 'openingVariation', exceptionBuilder, value => { game._openingVariation = value; });
		decodeStringField(pojo, 'openingSubVariation', exceptionBuilder, value => { game._openingSubVariation = value; });
		decodeStringField(pojo, 'termination', exceptionBuilder, value => { game._termination = value; });
		decodeStringField(pojo, 'result', exceptionBuilder, value => {
			const resultCode = resultFromString(value);
			if (resultCode < 0) {
				throw exceptionBuilder.build(i18n.INVALID_RESULT_IN_POJO);
			}
			game._result = resultCode;
		});

		// Moves
		game._moveTreeRoot.setPojo(pojo, exceptionBuilder);

		return game;
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
		pushIfDefined(formatEventAndRound(this._event, this._round[RoundPart.ROUND], this._round[RoundPart.SUB_ROUND], this._round[RoundPart.SUB_SUB_ROUND]));
		pushIfDefined(formatSimpleHeader('Site', this._site));
		pushIfDefined(formatSimpleHeader('Date', this.dateAsString('en-us')));
		pushIfDefined(formatPlayer('White', this._playerName[ColorImpl.WHITE], this._playerElo[ColorImpl.WHITE], this._playerTitle[ColorImpl.WHITE]));
		pushIfDefined(formatPlayer('Black', this._playerName[ColorImpl.BLACK], this._playerElo[ColorImpl.BLACK], this._playerTitle[ColorImpl.BLACK]));
		pushIfDefined(formatSimpleHeader('Annotator', this._annotator));
		pushIfDefined(formatSimpleHeader('ECO', this._eco));
		pushIfDefined(formatOpening(this._opening, this._openingVariation, this._openingSubVariation));
		pushIfDefined(formatSimpleHeader('Termination', this._termination));

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


function sanitizeStringHeader(value: unknown) {
	return value === undefined || value === null ? undefined : String(value);
}


function sanitizeNumberHeader(value: unknown) {
	return value === undefined || value === null ? undefined : Number(value);
}


function trimCollapseAndMarkEmpty(text: string) {
	text = trimAndCollapseSpaces(text);
	return text === '' ? '<empty>' : text;
}


function formatSimpleHeader(key: string, header: string | undefined) {
	return header === undefined ? undefined : `${key}: ${trimCollapseAndMarkEmpty(header)}`;
}


function formatEventAndRound(event: string | undefined, round: number | undefined, subRound: number | undefined, subSubRound: number | undefined) {
	if (event === undefined && round === undefined && subRound === undefined && subSubRound === undefined) {
		return undefined;
	}
	let result = event === undefined ? 'Event: <undefined>' : `Event: ${trimCollapseAndMarkEmpty(event)}`;
	const fullRound = formatFullRound(round, subRound, subSubRound, '*');
	if (fullRound !== undefined) {
		result += ` (${fullRound})`;
	}
	return result;
}


function formatFullRound(round: number | undefined, subRound: number | undefined, subSubRound: number | undefined, undefinedToken: string) {
	if (round === undefined && subRound === undefined && subSubRound === undefined) {
		return undefined;
	}
	let result = round === undefined ? undefinedToken : String(round);
	if (subRound !== undefined || subSubRound !== undefined) {
		result += '.' + (subRound ?? undefinedToken);
	}
	if (subSubRound !== undefined) {
		result += '.' + subSubRound;
	}
	return result;
}


function formatPlayer(key: string, playerName: string | undefined, playerElo: number | undefined, playerTitle: string | undefined) {
	if (playerName === undefined && playerElo === undefined && playerTitle === undefined) {
		return undefined;
	}
	let result = playerName === undefined ? `${key}: <undefined>` : `${key}: ${trimCollapseAndMarkEmpty(playerName)}`;
	if (playerElo !== undefined && playerTitle !== undefined) {
		result += ` (${trimCollapseAndMarkEmpty(playerTitle)} ${playerElo})`;
	}
	else if (playerElo !== undefined) {
		result += ` (${playerElo})`;
	}
	else if (playerTitle !== undefined) {
		result +=  ` (${trimCollapseAndMarkEmpty(playerTitle)})`;
	}
	return result;
}


function formatOpening(opening: string | undefined, openingVariation: string | undefined, openingSubVariation: string | undefined) {
	if (opening === undefined && openingVariation === undefined && openingSubVariation === undefined) {
		return undefined;
	}
	let result = opening === undefined ? 'Opening: <undefined>' : `Opening: ${trimCollapseAndMarkEmpty(opening)}`;
	if (openingSubVariation !== undefined) {
		result += ` (${openingVariation === undefined ? '<undefined>' : trimCollapseAndMarkEmpty(openingVariation)}, ${trimCollapseAndMarkEmpty(openingSubVariation)})`;
	}
	else if (openingVariation !== undefined) {
		result += ` (${trimCollapseAndMarkEmpty(openingVariation)})`;
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
