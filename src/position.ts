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


import { Color, Piece, ColoredPiece, File, Square, Castle, Castle960, GameVariant } from './base_types';
import { IllegalArgument, InvalidFEN, InvalidNotation } from './exception';
import { i18n } from './i18n';
import { MoveDescriptor } from './move_descriptor';

import { isAttacked, getAttacks } from './private_position/attacks';
import { SpI, GameVariantImpl, colorFromString, colorToString, pieceFromString, coloredPieceFromString, coloredPieceToString,
	fileFromString, fileToString, squareFromString, squareToString, variantFromString, variantToString } from './private_position/base_types_impl';
import { ascii, getFEN, parseFEN } from './private_position/fen';
import { PositionImpl, makeCopy, makeEmpty, makeInitial, make960FromScharnagl, hasCanonicalStartPosition } from './private_position/impl';
import { isLegal, refreshLegalFlagAndKingSquares, refreshEffectiveEnPassant, isEqual, refreshEffectiveCastling } from './private_position/legality';
import { MoveDescriptorImpl } from './private_position/move_descriptor_impl';
import { isCheck, isCheckmate, isStalemate, isDead, hasMove, moves, isMoveLegal, play, isNullMoveLegal, playNullMove } from './private_position/move_generation';
import { getNotation, parseNotation } from './private_position/notation';
import { getUCINotation, parseUCINotation } from './private_position/uci';


/**
 * Represent a chess position, i.e.:
 * - the state of a 64-square chessboard,
 * - who is about to play,
 * - the castling rights,
 * - and the file on which *en-passant* is possible, if any.
 */
export class Position {

	private _impl: PositionImpl;



	// -------------------------------------------------------------------------
	// Constructor & reset/clear
	// -------------------------------------------------------------------------


	/**
	 * Instantiate a new {@link Position} configured for the usual chess rules, and initialized with the usual starting position.
	 */
	constructor(state?: 'start');

	/**
	 * Instantiate a new {@link Position} configured for the usual chess rules, and initialized with an empty board.
	 */
	constructor(state: 'empty');

	/**
	 * Instantiate a new {@link Position} configured for the given chess game variant, and initialized with
	 * the usual starting position of this variant.
	 *
	 * Warning: only chess game variants with a canonical start position can be used here (see {@link variantWithCanonicalStartPosition}).
	 */
	constructor(variant: 'regular' | 'antichess' | 'horde', state?: 'start');

	/**
	 * Instantiate a new {@link Position} configured for the given chess game variant, and initialized with an empty board.
	 */
	constructor(variant: GameVariant, state: 'empty');

	/**
	 * Instantiate a new {@link Position} configured for the Chess960 game variant, and initialized with
	 * the starting position corresponding to the given Scharnagl code.
	 *
	 * @param scharnaglCode - Must be between 0 and 959 inclusive (see https://chess960.net/start-positions/
	 *                        or https://www.chessprogramming.org/Reinhard_Scharnagl for more details).
	 */
	constructor(variant: 'chess960', scharnaglCode: number);

	/**
	 * Instantiate a new {@link Position} and initialize it by parsing the given [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string.
	 *
	 * If the given FEN string is prefixed by the name of the chess game variant + `:`, the position is configured
	 * for the corresponding chess game variant. Otherwise, the usual chess rules are used.
	 *
	 * If the chess game variant is Chess960, [X-FEN](https://en.wikipedia.org/wiki/X-FEN) can be used instead of regular FEN.
	 *
	 * @throws {@link exception.InvalidFEN} if the given string cannot be parsed as a valid FEN string.
	 */
	constructor(fen: string);

	/**
	 * Instantiate a new {@link Position} configured for the given chess game variant, and initialize it by parsing the given
	 * [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string.
	 *
	 * If the chess game variant is Chess960, [X-FEN](https://en.wikipedia.org/wiki/X-FEN) can be used instead of regular FEN.
	 *
	 * @throws {@link exception.InvalidFEN} if the given string cannot be parsed as a valid FEN string.
	 */
	constructor(variant: GameVariant, fen: string);

	/**
	 * Instantiate a copy of the given {@link Position}.
	 */
	constructor(other: Position);

	constructor(arg0?: string | Position, arg1?: string | number) {
		switch (arguments.length) {

			// Default constructor
			case 0:
				this._impl = makeInitial(GameVariantImpl.REGULAR_CHESS);
				break;

			// Possible overloads with 1 argument:
			//  - 'start'
			//  - 'empty'
			//  - Position
			//  - GameVariant (valid only for variants with a cannonical starting position)
			//  - FEN
			//  - GameVariant:FEN
			case 1: {
				if (arg0 === 'start') {
					this._impl = makeInitial(GameVariantImpl.REGULAR_CHESS);
				}
				else if (arg0 === 'empty') {
					this._impl = makeEmpty(GameVariantImpl.REGULAR_CHESS);
				}
				else if (arg0 instanceof Position) {
					this._impl = makeCopy(arg0._impl);
				}
				else {
					const variantCode = variantFromString(arg0);
					if (variantCode >= 0) {
						if (!hasCanonicalStartPosition(variantCode)) {
							throw new IllegalArgument('Position()');
						}
						this._impl = makeInitial(variantCode);
					}
					else if (typeof arg0 === 'string') {
						const separatorIndex = arg0.indexOf(':');
						if (separatorIndex < 0) {
							this._impl = parseFEN(GameVariantImpl.REGULAR_CHESS, arg0, false).position;
						}
						else {
							const variantPrefix = arg0.substring(0, separatorIndex);
							const variantPrefixCode = variantFromString(variantPrefix);
							if (variantPrefixCode < 0) {
								throw new InvalidFEN(arg0, i18n.INVALID_VARIANT_PREFIX, variantPrefix);
							}
							this._impl = parseFEN(variantPrefixCode, arg0.substring(separatorIndex + 1), false).position;
						}
					}
					else {
						throw new IllegalArgument('Position()');
					}
				}
				break;
			}

			// Possible overloads with 2 arguments:
			//  - (GameVariant, 'start') (valid only for variants with a cannonical starting position)
			//  - (GameVariant, 'empty')
			//  - (GameVariant, scharnaglCode) (valid only for Chess960)
			//  - (GameVariant, FEN)
			default: {
				const variantCode = variantFromString(arg0);
				if (variantCode < 0) {
					throw new IllegalArgument('Position()');
				}
				if (arg1 === 'start') {
					if (!hasCanonicalStartPosition(variantCode)) {
						throw new IllegalArgument('Position()');
					}
					this._impl = makeInitial(variantCode);
				}
				else if (arg1 === 'empty') {
					this._impl = makeEmpty(variantCode);
				}
				else if (typeof arg1 === 'number') {
					if (variantCode !== GameVariantImpl.CHESS960 || !isValidScharnaglCode(arg1)) {
						throw new IllegalArgument('Position()');
					}
					this._impl = make960FromScharnagl(arg1);
				}
				else if (typeof arg1 === 'string') {
					this._impl = parseFEN(variantCode, arg1, false).position;
				}
				else {
					throw new IllegalArgument('Position()');
				}
				break;
			}
		}
	}


	/**
	 * Set the position to the empty state, for the given chess game variant.
	 */
	clear(variant: GameVariant = 'regular'): void {
		const variantCode = variantFromString(variant);
		if (variantCode < 0) {
			throw new IllegalArgument('Position.clear()');
		}
		this._impl = makeEmpty(variantCode);
	}


	/**
	 * Set the position to the starting state (in the regular chess variant).
	 */
	reset(): void {
		this._impl = makeInitial(GameVariantImpl.REGULAR_CHESS);
	}


	/**
	 * Set the position to Chess960 starting position corresponding to the given Scharnagl code.
	 *
	 * @param scharnaglCode - Must be between 0 and 959 inclusive (see https://chess960.net/start-positions/
	 *                        or https://www.chessprogramming.org/Reinhard_Scharnagl for more details).
	 */
	reset960(scharnaglCode: number): void {
		if (!isValidScharnaglCode(scharnaglCode)) {
			throw new IllegalArgument('Position.reset960()');
		}
		this._impl = make960FromScharnagl(scharnaglCode);
	}


	/**
	 * Set the position to the starting state of the antichess variant.
	 */
	resetAntichess(): void {
		this._impl = makeInitial(GameVariantImpl.ANTICHESS);
	}


	/**
	 * Set the position to the starting state of the horde chess variant.
	 */
	resetHorde(): void {
		this._impl = makeInitial(GameVariantImpl.HORDE);
	}


	/**
	 * Check whether both given objects represent the same chess position (i.e. the same chess variant, same board,
	 * and same turn/castling/en-passant flags).
	 */
	static isEqual(pos1: any, pos2: any): boolean {
		return pos1 instanceof Position && pos2 instanceof Position && isEqual(pos1._impl, pos2._impl);
	}



	// -------------------------------------------------------------------------
	// FEN & ASCII conversion
	// -------------------------------------------------------------------------


	/**
	 * Return a human-readable string representing the position. This string is multi-line,
	 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
	 * For instance:
	 *
	 * ```
	 * const position = new Position();
	 * console.log(position.ascii());
	 *
	 * // +---+---+---+---+---+---+---+---+
	 * // | r | n | b | q | k | b | n | r |
	 * // +---+---+---+---+---+---+---+---+
	 * // | p | p | p | p | p | p | p | p |
	 * // +---+---+---+---+---+---+---+---+
	 * // |   |   |   |   |   |   |   |   |
	 * // +---+---+---+---+---+---+---+---+
	 * // |   |   |   |   |   |   |   |   |
	 * // +---+---+---+---+---+---+---+---+
	 * // |   |   |   |   |   |   |   |   |
	 * // +---+---+---+---+---+---+---+---+
	 * // |   |   |   |   |   |   |   |   |
	 * // +---+---+---+---+---+---+---+---+
	 * // | P | P | P | P | P | P | P | P |
	 * // +---+---+---+---+---+---+---+---+
	 * // | R | N | B | Q | K | B | N | R |
	 * // +---+---+---+---+---+---+---+---+
	 * // w KQkq -
	 * ```
	 */
	ascii(): string {
		return ascii(this._impl);
	}


	/**
	 * Get the [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) representation of the current {@link Position}.
	 *
	 * @param options.fiftyMoveClock - Value of the fifty move clock counter (5th field) in the generated FEN string. `0` by default.
	 * @param options.fullMoveNumber - Value of the full move number counter (6th field) in the generated FEN string. `1` by default.
	 * @param options.withVariant - If `true`, a prefix containing the name of the chess game variant + `:` is prepend to the generated FEN string.
	 *                              `false` by default.
	 * @param options.regularFENIfPossible - For Chess960 only: if `true`, the castling flags are rendered using the regular-FEN style (i.e. `KQkq`)
	 *                                       if no ambiguity is possible; if `false` or if there is an ambiguity, X-FEN style (i.e. `AHah`) is used instead.
	 *                                       For non-Chess960 variants, this flag has no effect (regular FEN-style is always used in these cases).
	 *                                       `false` by default.
	 */
	fen(options?: { fiftyMoveClock?: number, fullMoveNumber?: number, withVariant?: boolean, regularFENIfPossible?: boolean }): string;

	/**
	 * Parse the given [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string and set the position accordingly.
	 *
	 * @param strict - If `true`, only perfectly formatted FEN strings are accepted. `false` by default.
	 * @throws {@link exception.InvalidFEN} if the given string cannot be parsed as a valid FEN string.
	 */
	fen(fen: string, strict?: boolean): { fiftyMoveClock: number, fullMoveNumber: number };

	fen(fenOrOptions?: string | { fiftyMoveClock?: number, fullMoveNumber?: number, withVariant?: boolean, regularFENIfPossible?: boolean }, strict?: boolean) {

		// Getter, without options.
		if (arguments.length === 0) {
			return getFEN(this._impl);
		}

		// Getter, with options.
		else if (arguments.length === 1 && typeof fenOrOptions === 'object') {
			const validate = buildValidator(fenOrOptions, 'Position.fen()');
			const fiftyMoveClock = validate('fiftyMoveClock', 0, val => Number.isInteger(val));
			const fullMoveNumber = validate('fullMoveNumber', 1, val => Number.isInteger(val));
			const withVariant = validate('withVariant', false, val => typeof val === 'boolean');
			const regularFENIfPossible = validate('regularFENIfPossible', false, val => typeof val === 'boolean');
			return (withVariant ? variantToString(this._impl.variant) + ':' : '') + getFEN(this._impl, fiftyMoveClock, fullMoveNumber, regularFENIfPossible);
		}

		// Setter, without strict option.
		else if (arguments.length === 1 && typeof fenOrOptions === 'string') {
			const result = parseFEN(this._impl.variant, fenOrOptions, false);
			this._impl = result.position;
			return { fiftyMoveClock: result.fiftyMoveClock, fullMoveNumber: result.fullMoveNumber };
		}

		// Setter, with strict option.
		else if (arguments.length >= 2 && typeof fenOrOptions === 'string' && typeof strict === 'boolean') {
			const result = parseFEN(this._impl.variant, fenOrOptions, strict);
			this._impl = result.position;
			return { fiftyMoveClock: result.fiftyMoveClock, fullMoveNumber: result.fullMoveNumber };
		}

		// Unsupported overload.
		else {
			throw new IllegalArgument('Position.fen()');
		}
	}



	// -------------------------------------------------------------------------
	// Accessors
	// -------------------------------------------------------------------------


	/**
	 * Get the chess game variant in use.
	 */
	variant(): GameVariant {
		return variantToString(this._impl.variant);
	}


	/**
	 * Get the content of a square.
	 */
	square(square: Square): ColoredPiece | '-';

	/**
	 * Set the content of a square.
	 */
	square(square: Square, value: ColoredPiece | '-'): void;

	square(square: Square, value?: ColoredPiece | '-') {
		const squareCode = squareFromString(square);
		if (squareCode < 0) {
			throw new IllegalArgument('Position.square()');
		}
		if (arguments.length === 1) {
			const cp = this._impl.board[squareCode];
			return cp === SpI.EMPTY ? '-' : coloredPieceToString(cp);
		}
		else if (value === '-') {
			this._impl.board[squareCode] = SpI.EMPTY;
			this._impl.legal = null;
			this._impl.effectiveCastling = null;
			this._impl.effectiveEnPassant = null;
		}
		else {
			const cp = coloredPieceFromString(value);
			if (cp < 0) {
				throw new IllegalArgument('Position.square()');
			}
			this._impl.board[squareCode] = cp;
			this._impl.legal = null;
			this._impl.effectiveCastling = null;
			this._impl.effectiveEnPassant = null;
		}
	}


	/**
	 * Get the turn flag (i.e. who is about to play).
	 */
	turn(): Color;

	/**
	 * Set the turn flag (i.e. who is about to play).
	 */
	turn(value: Color): void;

	turn(value?: Color) {
		if (arguments.length === 0) {
			return colorToString(this._impl.turn);
		}
		else {
			const colorCode = colorFromString(value);
			if (colorCode < 0) {
				throw new IllegalArgument('Position.turn()');
			}
			this._impl.turn = colorCode;
			this._impl.legal = null;
			this._impl.effectiveEnPassant = null;
		}
	}


	/**
	 * Get a castle flag (i.e. whether or not the corresponding castle is allowed or not).
	 *
	 * @param castle - Must be {@link Castle960} if the {@link Position} is configured for Chess960, or {@link Castle} otherwise.
	 */
	castling(castle: Castle | Castle960): boolean;

	/**
	 * Set a castle flag (i.e. whether or not the corresponding castle is allowed or not).
	 *
	 * @param castle - Must be {@link Castle960} if the {@link Position} is configured for Chess960, or {@link Castle} otherwise.
	 */
	castling(castle: Castle | Castle960, value: boolean): void;

	castling(castle: Castle | Castle960, value?: boolean) {
		if (typeof castle !== 'string' || !(this._impl.variant === GameVariantImpl.CHESS960 ? /^[wb][a-h]$/ : /^[wb][kq]$/).test(castle)) {
			throw new IllegalArgument('Position.castling()');
		}
		const color = colorFromString(castle[0]);
		const file = this._impl.variant === GameVariantImpl.CHESS960 ? fileFromString(castle[1]) : castle[1] === 'k' ? 7 : 0;

		if (arguments.length === 1) {
			return (this._impl.castling[color] & 1 << file) !== 0;
		}
		else if (typeof value === 'boolean') {
			if (value) {
				this._impl.castling[color] |= 1 << file;
			}
			else {
				this._impl.castling[color] &= ~(1 << file);
			}
			this._impl.effectiveCastling = null;
		}
		else {
			throw new IllegalArgument('Position.castling()');
		}
	}


	/**
	 * Get a validated (aka. effective) castle flag (i.e. whether or not the corresponding castle is allowed or not).
	 *
	 * Compared to {@link Position.castling}, if this method returns `true`, then it is guaranteed that there are a king and a rook on the squares
	 * corresponding to the given castle.
	 *
	 * @param castle - Must be {@link Castle960} if the {@link Position} is configured for Chess960, or {@link Castle} otherwise.
	 */
	effectiveCastling(castle: Castle | Castle960): boolean {
		if (typeof castle !== 'string' || !(this._impl.variant === GameVariantImpl.CHESS960 ? /^[wb][a-h]$/ : /^[wb][kq]$/).test(castle)) {
			throw new IllegalArgument('Position.effectiveCastling()');
		}
		const color = colorFromString(castle[0]);
		const file = this._impl.variant === GameVariantImpl.CHESS960 ? fileFromString(castle[1]) : castle[1] === 'k' ? 7 : 0;
		refreshEffectiveCastling(this._impl);
		return (this._impl.effectiveCastling![color] & 1 << file) !== 0;
	}


	/**
	 * Get the *en-passant* flag (i.e. the file on which a 2-square pawn move has just happen, if any).
	 *
	 * WARNING: even if this method returns something different from `'-'`, *en-passant* capture may not be possible on the corresponding file.
	 * Use {@link Position.effectiveEnPassant} to determine whether *en-passant* capture is actually possible or not.
	 */
	enPassant(): File | '-';

	/**
	 * Set the *en-passant* flag (i.e. the file on which a 2-square pawn move has just happen, if any).
	 */
	enPassant(value: File | '-'): void;

	enPassant(value?: File | '-') {
		if (arguments.length === 0) {
			return this._impl.enPassant < 0 ? '-' : fileToString(this._impl.enPassant);
		}
		else if (value === '-') {
			this._impl.enPassant = -1;
			this._impl.effectiveEnPassant = -1;
		}
		else {
			const enPassantCode = fileFromString(value);
			if (enPassantCode < 0) {
				throw new IllegalArgument('Position.enPassant()');
			}
			this._impl.enPassant = enPassantCode;
			this._impl.effectiveEnPassant = null;
		}
	}


	/**
	 * Get the effective *en-passant* flag (i.e. the column on which a *en-passant* capture is possible, if any).
	 *
	 * If {@link Position.enPassant} returns `'-'`, this method returns `'-'`. Otherwise, it returns:
	 * - either the same file that is returned by {@link Position.enPassant} if a *en-passant* capture is allowed on this file,
	 * - or `'-'` otherwise.
	 */
	effectiveEnPassant(): File | '-' {
		refreshEffectiveEnPassant(this._impl);
		return this._impl.effectiveEnPassant! < 0 ? '-' : fileToString(this._impl.effectiveEnPassant!);
	}


	// -------------------------------------------------------------------------
	// Attacks
	// -------------------------------------------------------------------------


	/**
	 * Check if any piece of the given color attacks the given square.
	 */
	isAttacked(square: Square, byWho: Color): boolean {
		const squareCode = squareFromString(square);
		const byWhoCode = colorFromString(byWho);
		if (squareCode < 0 || byWhoCode < 0) {
			throw new IllegalArgument('Position.isAttacked()');
		}
		return isAttacked(this._impl, squareCode, byWhoCode);
	}


	/**
	 * Return the squares from which a piece of the given color attacks the given square.
	 */
	getAttacks(square: Square, byWho: Color): Square[] {
		const squareCode = squareFromString(square);
		const byWhoCode = colorFromString(byWho);
		if (squareCode < 0 || byWhoCode < 0) {
			throw new IllegalArgument('Position.getAttacks()');
		}
		return getAttacks(this._impl, squareCode, byWhoCode).map(squareToString);
	}



	// -------------------------------------------------------------------------
	// Legality
	// -------------------------------------------------------------------------


	/**
	 * Check whether the current position is legal or not.
	 *
	 * A position is considered to be legal if all the following conditions are met:
	 *
	 * 1. There is exactly one white king and one black king on the board (or more generally,
	 *    the number of kings on the board matches what is expected in the game variant of the position).
	 * 2. The player that is not about to play is not in check (this condition is omitted for variants
	 *    in which kings have no royal power).
	 * 3. There are no pawn on ranks 1 and 8 (except if the game variant of the position allows it).
	 */
	isLegal(): boolean {
		return isLegal(this._impl);
	}


	/**
	 * Return the square on which is located the king of the given color. If there is no such king on the board
	 * (or on the contrary, if there are two or more such kings on the board), `false` is returned.
	 *
	 * For non-standard variants, the behavior of this method depends on whether king has royal power in the current variant or not
	 * (i.e. whether it can be put in check or not). For instance:
	 * - in antichess, the king has no royal power, thus `false` is always returned,
	 * - in Chess960, the king has royal power (as in the usual chess rules), thus the method returns the square on which the king is located.
	 */
	kingSquare(color: Color): Square | false {
		const colorCode = colorFromString(color);
		if (colorCode < 0) {
			throw new IllegalArgument('Position.kingSquare()');
		}
		refreshLegalFlagAndKingSquares(this._impl);
		const squareCode = this._impl.king[colorCode];
		return squareCode < 0 ? false : squareToString(squareCode);
	}



	// -------------------------------------------------------------------------
	// Move generation
	// -------------------------------------------------------------------------


	/**
	 * Whether the player that is about to play is in check or not. If the position is not legal (see {@link Position.isLegal}),
	 * the returned value is always `false`.
	 *
	 * For antichess, this method always returns `false`.
	 */
	isCheck(): boolean {
		return isCheck(this._impl);
	}


	/**
	 * Whether the player that is about to play is checkmated or not. If the position is not legal (see {@link Position.isLegal}),
	 * the returned value is always `false`.
	 *
	 * For antichess, this method returns `true` if the player about to play has no remaining piece or pawn,
	 * or if non of his/her remaining pieces can move (i.e. same behavior as {@link Position.isStalemate} for this variant).
	 *
	 * For horde chess, this method returns `true` if black has been checkmated or if white has no remaining piece.
	 */
	isCheckmate(): boolean {
		return isCheckmate(this._impl);
	}


	/**
	 * Whether the player that is about to play is stalemated or not. If the position is not legal (see {@link Position.isLegal}),
	 * the returned value is always `false`.
	 *
	 * For antichess, this method returns `true` if the player about to play has no remaining piece or pawn,
	 * or if non of his/her remaining pieces can move (i.e. same behavior as {@link Position.isCheckmate} for this variant).
	 *
	 * For horde chess, this method returns `true` if black has been stalemated or if white cannot move but has still at least one piece.
	 */
	isStalemate(): boolean {
		return isStalemate(this._impl);
	}


	/**
	 * Whether both players have insufficient material so the game cannot end in checkmate. If the position is not legal (see {@link Position.isLegal}),
	 * the returned value is always `false`.
   *
   * If `forcedMate` is not set or set to `false`, method uses **FIDE** rules where position is evaluated to return no possible checkmates
   * If `forcedMate` is set to `true`, method uses **USCF** rules where position is evaluated to return no possible *forced* checkmates
	 *
	 * For antichess and horde chess, this method always returns `false`
	 */
	isDead(forcedMate?: boolean): boolean {
		return isDead(this._impl, forcedMate);
	}


	/**
	 * Whether at least one legal move exists in the current position or not. If the position is not legal (see {@link Position.isLegal}),
	 * the returned value is always `false`.
	 */
	hasMove(): boolean {
		return hasMove(this._impl);
	}


	/**
	 * Return the list of all legal moves in the current position. An empty list is returned if the position itself is not legal
	 * (see {@link Position.isLegal}).
	 */
	moves(): MoveDescriptor[] {
		return moves(this._impl);
	}


	/**
	 * Check whether a move is legal or not, and return a factory capable the corresponding {@link MoveDescriptor}(-s) if it is legal.
	 *
	 * For castling moves, `to` is supposed to represent:
	 * - for regular chess, the destination square of the king (i.e. c1, g1, c8 or g8),
	 * - for Chess960, the origin square of the rook ("king-take-rook" pattern).
	 *
	 * A code interpreting the result returned by {@link Position.isMoveLegal} would typically look like this:
	 *
	 * ```
	 * const result = position.isMoveLegal(from, to);
	 * if (!result) {
	 *   // The move "from -> to" is not legal.
	 * }
	 * else {
	 *   switch (result.status) {
	 *
	 *     case 'regular':
	 *       // The move "from -> to" is legal, and the corresponding move descriptor
	 *       // is `result()`.
	 *       break;
	 *
	 *     case 'promotion':
	 *       // The move "from -> to" is legal, but it corresponds to a promotion,
	 *       // so the promoted piece must be specified. The corresponding move descriptors
	 *       // are `result('q')`, `result('r')`, `result('b')` and `result('n')`.
	 *       break;
	 *
	 *     default:
	 *       // This case is not supposed to happen.
	 *       break;
	 *   }
	 * }
	 * ```
	 */
	isMoveLegal(from: Square, to: Square): RegularMoveFactory | PromotionMoveFactory | false {
		const fromCode = squareFromString(from);
		const toCode = squareFromString(to);
		if (fromCode < 0 || toCode < 0) {
			throw new IllegalArgument('Position.isMoveLegal()');
		}
		const moveInfo = isMoveLegal(this._impl, fromCode, toCode);

		// No legal move.
		if (!moveInfo) {
			return false;
		}

		switch (moveInfo.type) {

			case 'promotion': {
				const result = (promotion: Piece) => {
					const promotionCode = pieceFromString(promotion);
					if (promotionCode >= 0) {
						const moveDescriptor = moveInfo.moveDescriptorFactory(promotionCode);
						if (moveDescriptor) {
							return moveDescriptor;
						}
					}
					throw new IllegalArgument('Position.isMoveLegal()');
				};
				result.status = 'promotion' as const;
				return result;
			}

			case 'regular': {
				const result = () => moveInfo.moveDescriptor;
				result.status = 'regular' as const;
				return result;
			}
		}
	}


	/**
	 * Try to parse the given string as a [SAN](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) notation, and to play
	 * the corresponding move on the current position.
	 *
	 * @returns `true` if the move has been played, `false` if the move is not legal or if the string passed to the method
	 *          cannot be interpreted as a valid SAN move notation.
	 */
	play(move: string): boolean;

	/**
	 * Play the given move.
	 *
	 * @param moveDescriptor - WARNING: this {@link MoveDescriptor} MUST have been generated by one of the methods of the current {@link Position}.
	 *                         Trying to invoke {@link Position.play} with a {@link MoveDescriptor} generated by another {@link Position} instance
	 *                         would result in an undefined behavior.
	 */
	play(moveDescriptor: MoveDescriptor): true;

	play(move: string | MoveDescriptor): boolean {
		if (typeof move === 'string') {
			try {
				play(this._impl, parseNotation(this._impl, move, false, 'standard'));
				return true;
			}
			catch (err) {
				// istanbul ignore else
				if (err instanceof InvalidNotation) {
					return false;
				}
				else {
					throw err;
				}
			}
		}
		else if (move instanceof MoveDescriptorImpl) {
			play(this._impl, move);
			return true;
		}
		else {
			throw new IllegalArgument('Position.play()');
		}
	}


	/**
	 * Whether a null-move (i.e. switching the player about to play) can be played in the current position or not.
	 *
	 * A null-move is possible if the position is legal and if the current player about to play is not in check.
	 */
	isNullMoveLegal(): boolean {
		return isNullMoveLegal(this._impl);
	}


	/**
	 * Play a null-move on the current position if it is legal.
	 *
	 * @returns `true` if the move has actually been played, `false` otherwise.
	 */
	playNullMove(): boolean {
		return playNullMove(this._impl);
	}



	// -------------------------------------------------------------------------
	// Algebraic notation
	// -------------------------------------------------------------------------


	/**
	 * Return the [standard algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) corresponding to the given move descriptor.
	 */
	notation(moveDescriptor: MoveDescriptor): string;

	/**
	 * Parse the given string as [standard algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))
	 * and return the corresponding move descriptor.
	 *
	 * @param strict - If `true`, only perfectly formatted SAN moves are accepted. If `false`, "small errors" in the input
	 *                 such as a missing capture character, an unnecessary disambiguation symbol... do not interrupt the parsing.
	 *                 `false` by default.
	 * @throws {@link exception.InvalidNotation} if the move parsing fails or if the parsed move would correspond to an illegal move.
	 */
	notation(move: string, strict?: boolean): MoveDescriptor;

	notation(moveOrDescriptor: string | MoveDescriptor, strict?: boolean) {
		if (arguments.length === 1 && moveOrDescriptor instanceof MoveDescriptorImpl) {
			return getNotation(this._impl, moveOrDescriptor, 'standard');
		}
		else if (arguments.length === 1 && typeof moveOrDescriptor === 'string') {
			return parseNotation(this._impl, moveOrDescriptor, false, 'standard') as MoveDescriptor;
		}
		else if (arguments.length >= 2 && typeof moveOrDescriptor === 'string' && typeof strict === 'boolean') {
			return parseNotation(this._impl, moveOrDescriptor, strict, 'standard') as MoveDescriptor;
		}
		else {
			throw new IllegalArgument('Position.notation()');
		}
	}


	/**
	 * Return the figurine algebraic notation corresponding to the given move descriptor (figurine algebraic notation is the same as
	 * [standard algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)), except that chess pieces are represented
	 * with their respective unicode character, instead of the first letter of their English name).
	 */
	figurineNotation(moveDescriptor: MoveDescriptor): string;

	/**
	 * Parse the given string as figurine algebraic notation and return the corresponding move descriptor (figurine algebraic notation is the same as
	 * [standard algebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)), except that chess pieces are represented
	 * with their respective unicode character, instead of the first letter of their English name).
	 *
	 * @param strict - If `true`, only perfectly formatted FAN moves are accepted. If `false`, "small errors" in the input
	 *                 such as a missing capture character, an unnecessary disambiguation symbol... do not interrupt the parsing.
	 *                 `false` by default.
	 * @throws {@link exception.InvalidNotation} if the move parsing fails or if the parsed move would correspond to an illegal move.
	 */
	figurineNotation(move: string, strict?: boolean): MoveDescriptor;

	figurineNotation(moveOrDescriptor: string | MoveDescriptor, strict?: boolean) {
		if (arguments.length === 1 && moveOrDescriptor instanceof MoveDescriptorImpl) {
			return getNotation(this._impl, moveOrDescriptor, 'figurine');
		}
		else if (arguments.length === 1 && typeof moveOrDescriptor === 'string') {
			return parseNotation(this._impl, moveOrDescriptor, false, 'figurine') as MoveDescriptor;
		}
		else if (arguments.length >= 2 && typeof moveOrDescriptor === 'string' && typeof strict === 'boolean') {
			return parseNotation(this._impl, moveOrDescriptor, strict, 'figurine') as MoveDescriptor;
		}
		else {
			throw new IllegalArgument('Position.figurineNotation()');
		}
	}



	// -------------------------------------------------------------------------
	// UCI
	// -------------------------------------------------------------------------


	/**
	 * Return the UCI notation corresponding to the given move descriptor.
	 *
	 * Examples of UCI notation: `'e2e4'`, `'b8c6'`, `'e7e8q'` (promotion)... For more details, please refer to:
	 * - https://en.wikipedia.org/wiki/Universal_Chess_Interface
	 * - https://www.chessprogramming.org/UCI
	 * - https://www.shredderchess.com/download/div/uci.zip
	 *
	 * @param forceKxR - If `true`, castling moves are encoded as "king-take-rook", i.e. for instance white king-side castling will be `'e1h1'`
	 *                   (instead of `'e1g1'` in UCI standard). If `false`, castling move encoding follows the UCI standard for normal chess games
	 *                   (e.g. `'e1g1'`). For Chess960 games, the "king-take-rook" style is always used, whatever the value of this flag.
	 *                   `false` by default.
	 */
	uci(moveDescriptor: MoveDescriptor, forceKxR?: boolean): string;

	/**
	 * Parse the given string as UCI notation and return the corresponding move descriptor.
	 *
	 * @param strict - If `true`, "king-take-rook"-encoded castling moves (i.e. for instance `'e1h1'` for white king-side castling)
	 *                 are rejected in case of normal chess games. If `false`, both "king-take-rook"-encoded and UCI-standard-encoded castling moves
	 *                 (e.g. `'e1g1'`) are accepted. For Chess960 games, only the "king-take-rook" style is accepted, whatever the value of this flag.
	 *                 `false` by default.
	 * @throws {@link exception.InvalidNotation} if the move parsing fails or if the parsed move would correspond to an illegal move.
	 */
	uci(move: string, strict?: boolean): MoveDescriptor;

	uci(moveOrDescriptor: string | MoveDescriptor, strictOrForceKxR?: boolean) {
		if (arguments.length === 1 && moveOrDescriptor instanceof MoveDescriptorImpl) {
			return getUCINotation(this._impl, moveOrDescriptor, false);
		}
		else if (arguments.length >= 2 && moveOrDescriptor instanceof MoveDescriptorImpl && typeof strictOrForceKxR === 'boolean') {
			return getUCINotation(this._impl, moveOrDescriptor, strictOrForceKxR);
		}
		else if (arguments.length === 1 && typeof moveOrDescriptor === 'string') {
			return parseUCINotation(this._impl, moveOrDescriptor, false) as MoveDescriptor;
		}
		else if (arguments.length >= 2 && typeof moveOrDescriptor === 'string' && typeof strictOrForceKxR === 'boolean') {
			return parseUCINotation(this._impl, moveOrDescriptor, strictOrForceKxR) as MoveDescriptor;
		}
		else {
			throw new IllegalArgument('Position.uci()');
		}
	}

}


/**
 * @see {@link Position.isMoveLegal}
 */
export type RegularMoveFactory = {
	status: 'regular';
	(): MoveDescriptor;
};


/**
 * @see {@link Position.isMoveLegal}
 */
export type PromotionMoveFactory = {
	status: 'promotion';
	(promotion: Piece): MoveDescriptor;
};


function isValidScharnaglCode(scharnaglCode: number) {
	return Number.isInteger(scharnaglCode) && scharnaglCode >= 0 && scharnaglCode < 960;
}


function buildValidator(options: any, functionName: string) {
	return function <T>(key: string, defaultValue: T, validator: (val: any) => boolean): T {
		if (options[key] === undefined) {
			return defaultValue;
		}
		else {
			const value = options[key];
			if (!validator(value)) {
				throw new IllegalArgument(functionName);
			}
			return value as T;
		}
	};
}
