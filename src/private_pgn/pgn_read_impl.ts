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


import { GameResult, GameVariant } from '../base_types';
import { Database } from '../database';
import { DateValue } from '../date_value';
import { InvalidFEN, InvalidNotation, InvalidPGN } from '../exception';
import { Game } from '../game';
import { isValidECO, variantWithCanonicalStartPosition } from '../helper';
import { i18n } from '../i18n';
import { Node, Variation } from '../node_variation';
import { Position } from '../position';

import { StreamPosition, TokenCommentData, TokenStream, TokenType } from './token_stream';


function parseNullableHeader(value: string): string | undefined {
	return value === '?' ? undefined : value;
}


function parsePositiveIntegerHeader(value: string): number | undefined {
	if (/^\d+$/.test(value)) {
		const result = Number(value);
		if (Number.isInteger(result)) {
			return result;
		}
	}
	return undefined;
}


function parseDateHeader(value: string): DateValue | undefined {
	if (/^([0-9]{4})\.([0-9]{2})\.([0-9]{2})$/.test(value)) {
		const y = RegExp.$1;
		const m = RegExp.$2;
		const d = RegExp.$3;
		const year = parseInt(y, 10);
		const month = parseInt(m, 10);
		const day = parseInt(d, 10);
		return DateValue.isValid(year, month, day) ? new DateValue(year, month, day) : DateValue.isValid(year, month) ? new DateValue(year, month) :
			DateValue.isValid(year) ? new DateValue(year) : undefined;
	}
	else if (/^([0-9]{4})\.([0-9]{2})\.\?\?$/.test(value)) {
		const y = RegExp.$1;
		const m = RegExp.$2;
		const year = parseInt(y, 10);
		const month = parseInt(m, 10);
		return DateValue.isValid(year, month) ? new DateValue(year, month) : DateValue.isValid(year) ? new DateValue(year) : undefined;
	}
	else if (/^([0-9]{4})(?:\.\?\?\.\?\?)?$/.test(value)) {
		const year = parseInt(RegExp.$1, 10);
		return DateValue.isValid(year) ? new DateValue(year) : undefined;
	}
	else {
		return undefined;
	}
}


function parseECOHeader(value: string): string | undefined {
	return isValidECO(value) ? value : undefined;
}


function parseVariant(value: string): GameVariant | undefined {
	value = value.toLowerCase();
	if (value === 'regular' || value === 'standard') {
		return 'regular';
	}
	else if (value === 'fischerandom' || /^chess[ -]?960$/.test(value)) {
		return 'chess960';
	}
	else if (/^no[ -]king$/.test(value)) {
		return 'no-king';
	}
	else if (/^white[ -]king[ -]only$/.test(value)) {
		return 'white-king-only';
	}
	else if (/^black[ -]king[ -]only$/.test(value)) {
		return 'black-king-only';
	}
	else if (/^anti[ -]?chess/.test(value)) {
		return 'antichess';
	}
	else if (value === 'horde') {
		return 'horde';
	}
	else {
		return undefined;
	}
}


interface InitialPositionFactory {
	fen?: string;
	fenTokenCharacterIndex?: number;
	fenTokenLineIndex?: number;
	variant?: GameVariant;
	variantTokenCharacterIndex?: number;
	variantTokenLineIndex?: number;
}


function processHeader(stream: TokenStream, game: Game, factory: InitialPositionFactory, key: string, value: string, valueCharacterIndex: number, valueLineIndex: number) {
	value = value.trim();
	switch (key) {
		case 'White': game.playerName('w', parseNullableHeader(value)); break;
		case 'Black': game.playerName('b', parseNullableHeader(value)); break;
		case 'WhiteElo': game.playerElo('w', parsePositiveIntegerHeader(value)); break;
		case 'BlackElo': game.playerElo('b', parsePositiveIntegerHeader(value)); break;
		case 'WhiteTitle': game.playerTitle('w', value); break;
		case 'BlackTitle': game.playerTitle('b', value); break;
		case 'Event': game.event(parseNullableHeader(value)); break;
		case 'Round': game.round(parseNullableHeader(value)); break;
		case 'Date': game.date(parseDateHeader(value)); break;
		case 'Site': game.site(parseNullableHeader(value)); break;
		case 'Annotator': game.annotator(value); break;
		case 'ECO': game.eco(parseECOHeader(value)); break;

		// The header 'FEN' has a special meaning, in that it is used to define a custom
		// initial position, that may be different from the usual one.
		case 'FEN':
			factory.fen = value;
			factory.fenTokenCharacterIndex = valueCharacterIndex;
			factory.fenTokenLineIndex = valueLineIndex;
			break;

		// The header 'Variant' indicates that this is not a regular chess game.
		case 'Variant':
			factory.variant = parseVariant(value);
			if (factory.variant === undefined) {
				throw new InvalidPGN(stream.text(), valueCharacterIndex, valueLineIndex, i18n.UNKNOWN_VARIANT, value);
			}
			factory.variantTokenCharacterIndex = valueCharacterIndex;
			factory.variantTokenLineIndex = valueLineIndex;
			break;
	}
}


function initializeInitialPosition(stream: TokenStream, game: Game, factory: InitialPositionFactory) {

	// If a FEN header has been encountered, set-up the initial position with it, taking the optional variant into account.
	if (factory.fen !== undefined) {
		try {
			const position = factory.variant === undefined ? new Position() : new Position(factory.variant, 'empty');
			const moveCounters = position.fen(factory.fen);
			game.initialPosition(position, moveCounters.fullMoveNumber);
		}
		catch (error) {
			// istanbul ignore else
			if (error instanceof InvalidFEN) {
				throw new InvalidPGN(stream.text(), factory.fenTokenCharacterIndex!, factory.fenTokenLineIndex!, i18n.INVALID_FEN_IN_PGN_TEXT, error.message);
			}
			else {
				throw error;
			}
		}
	}

	// Otherwise, if a variant header has been encountered, but without FEN header...
	else if (factory.variant !== undefined) {
		if (variantWithCanonicalStartPosition(factory.variant)) {
			const position = new Position(factory.variant, 'start');
			game.initialPosition(position, 1);
		}
		else {
			throw new InvalidPGN(stream.text(), factory.variantTokenCharacterIndex!, factory.variantTokenLineIndex!, i18n.VARIANT_WITHOUT_FEN, factory.variant);
		}
	}

	// If neither a variant header nor a FEN header has been encountered, nothing to do (the default initial position as defined in the `Game` object
	// is the right one).
}


/**
 * Parse exactly 1 game from the given stream.
 */
function doParseGame(stream: TokenStream) {

	// State variable for syntactic analysis.
	let game: Game | null = null;  // the result
	let node: Node | Variation | null = null;  // current node (or variation) to which the next move should be appended
	const nodeStack: (Node | Variation)[] = []; // when starting a variation, its parent node (btw., always a "true" node, not a variation) is stacked here
	const initialPositionFactory: InitialPositionFactory = {};

	// Token loop
	while (stream.consumeToken()) {

		// Create a new game if necessary
		if (game === null) {
			game = new Game();
		}

		// Set-up the root node when the first move-text token is encountered.
		if (stream.isMoveTextSection() && node === null) {
			initializeInitialPosition(stream, game, initialPositionFactory);
			node = game.mainVariation();
		}

		// Token type switch
		switch(stream.token()) {

			// Header
			case TokenType.BEGIN_HEADER: {
				if (node !== null) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_PGN_HEADER);
				}
				if (!stream.consumeToken() || stream.token() !== TokenType.HEADER_ID) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.MISSING_PGN_HEADER_ID);
				}
				const headerId = stream.tokenValue<string>();
				if (!stream.consumeToken() || stream.token() !== TokenType.HEADER_VALUE) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.MISSING_PGN_HEADER_VALUE);
				}
				const headerValue = stream.tokenValue<string>();
				const headerValueCharacterIndex = stream.tokenCharacterIndex();
				const headerValueLineIndex = stream.tokenLineIndex();
				if (!stream.consumeToken() || stream.token() !== TokenType.END_HEADER) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.MISSING_END_OF_PGN_HEADER);
				}
				processHeader(stream, game, initialPositionFactory, headerId, headerValue, headerValueCharacterIndex, headerValueLineIndex);
				break;
			}

			// Move number
			case TokenType.MOVE_NUMBER:
				break;

			// Move or null-move
			case TokenType.MOVE:
				try {
					node = node!.play(stream.tokenValue<string>());
				}
				catch (error) {
					// istanbul ignore else
					if (error instanceof InvalidNotation) {
						throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.INVALID_MOVE_IN_PGN_TEXT, error.notation, error.message);
					}
					else {
						throw error;
					}
				}
				break;

			// NAG
			case TokenType.NAG:
				node!.addNag(stream.tokenValue<number>());
				break;

			// Comment
			case TokenType.COMMENT: {
				const tokenValue = stream.tokenValue<TokenCommentData>();
				for (const [ key, value ] of tokenValue.tags) {
					node!.tag(key, value);
				}
				if (tokenValue.comment !== undefined) {
					const isLongComment = node instanceof Variation ? stream.emptyLineAfterToken() : stream.emptyLineBeforeToken();
					node!.comment(tokenValue.comment, isLongComment);
				}
				break;
			}

			// Begin of variation
			case TokenType.BEGIN_VARIATION:
				if (node instanceof Variation) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_BEGIN_OF_VARIATION);
				}
				nodeStack.push(node!);
				node = (node! as Node).addVariation(stream.emptyLineBeforeToken());
				break;

			// End of variation
			case TokenType.END_VARIATION:
				if (nodeStack.length === 0) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_END_OF_VARIATION);
				}
				node = nodeStack.pop()!;
				break;

			// End-of-game
			case TokenType.END_OF_GAME:
				if (nodeStack.length !== 0) {
					throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_END_OF_GAME);
				}
				game.result(stream.tokenValue<GameResult>());
				return game;

			// Something unexpected...
			default:
				throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.INVALID_PGN_TOKEN);

		} // switch(stream.token())

	} // while(stream.consumeToken())

	throw new InvalidPGN(stream.text(), stream.tokenCharacterIndex(), stream.tokenLineIndex(), i18n.UNEXPECTED_END_OF_TEXT);
}


/**
 * Implementation of {@link Database} for a PGN reader.
 */
class PGNDatabaseImpl extends Database {

	private _text: string;
	private _gameLocations: StreamPosition[];
	private _currentGameIndex = -1;
	private _stream: TokenStream;


	constructor(pgnString: string) {
		super();
		this._text = pgnString;
		this._gameLocations = [];
		this._stream = new TokenStream(pgnString);
		while (true) {
			const currentLocation = this._stream.currentLocation();
			if (!this._stream.skipGame()) {
				break;
			}
			this._gameLocations.push(currentLocation);
		}
	}


	protected doGameCount() {
		return this._gameLocations.length;
	}


	protected doGame(gameIndex: number) {
		if (gameIndex >= this._gameLocations.length) {
			throw new InvalidPGN(this._text, -1, -1, i18n.INVALID_GAME_INDEX, gameIndex, this._gameLocations.length);
		}
		if (this._currentGameIndex !== gameIndex) {
			this._stream = new TokenStream(this._text, this._gameLocations[gameIndex]);
		}
		this._currentGameIndex = -1;
		const result = doParseGame(this._stream);
		this._currentGameIndex = gameIndex + 1;
		return result;
	}

}


/**
 * Read a PGN string and return a {@link Database} object.
 */
export function readDatabase(pgnString: string): Database {
	return new PGNDatabaseImpl(pgnString);
}


/**
 * Read exactly 1 {@link Game} within the given PGN string.
 */
export function readOneGame(pgnString: string, gameIndex: number) {
	const stream = new TokenStream(pgnString);
	let gameCounter = 0;
	while (gameCounter !== gameIndex) {
		if (stream.skipGame()) {
			++gameCounter;
		}
		else {
			throw new InvalidPGN(pgnString, -1, -1, i18n.INVALID_GAME_INDEX, gameIndex, gameCounter);
		}
	}
	return doParseGame(stream);
}
