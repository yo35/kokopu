/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2025  Yoann Le Montagner <yo35 -at- melix.net>       *
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


import { ColorImpl, PieceImpl, SpI, GameVariantImpl, colorFromString, colorToString, fileFromString, fileToString, variantToString } from './base_types_impl';
import { PositionImpl, makeEmpty } from './impl';
import { refreshEffectiveCastling, refreshEffectiveEnPassant } from './legality';

import { InvalidFEN } from '../exception';
import { i18n } from '../i18n';

const FEN_PIECE_SYMBOL = [ ...'KkQqRrBbNnPp' ];
const EN_PASSANT_RANK = [ '6', '3' ];


/**
 * Return a human-readable string representing the position. This string is multi-line,
 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
 */
export function ascii(position: PositionImpl) {

    // Board scanning
    let result = '+---+---+---+---+---+---+---+---+\n';
    for (let r = 7; r >= 0; --r) {
        for (let c = 0; c < 8; ++c) {
            const cp = position.board[r * 16 + c];
            result += '| ' + (cp === SpI.EMPTY ? ' ' : FEN_PIECE_SYMBOL[cp]) + ' ';
        }
        result += '| ' + (r + 1) + '\n';
        result += '+---+---+---+---+---+---+---+---+\n';
    }
    result += '  a   b   c   d   e   f   g   h\n';

    // Flags
    result += colorToString(position.turn) + ' ' + castlingToString(position) + ' ' + enPassantToString(position);
    if (position.variant !== GameVariantImpl.REGULAR_CHESS) {
        result += ' (' + variantToString(position.variant) + ')';
    }

    // fen string
    result += '\n' + getFEN(position) + '\n';

    return result;
}


export function getFEN(position: PositionImpl, fiftyMoveClock = 0, fullMoveNumber = 1, regularFENIfPossible = false) {
    let result = '';

    // Board scanning
    for (let r = 7; r >= 0; --r) {
        let emptyCount = 0;
        for (let c = 0; c < 8; ++c) {
            const cp = position.board[r * 16 + c];
            if (cp === SpI.EMPTY) {
                ++emptyCount;
            }
            else {
                if (emptyCount > 0) {
                    result += emptyCount;
                    emptyCount = 0;
                }
                result += FEN_PIECE_SYMBOL[cp];
            }
        }
        if (emptyCount > 0) {
            result += emptyCount;
        }
        if (r > 0) {
            result += '/';
        }
    }

    // Flags + additional move counters
    result += ' ' + colorToString(position.turn) + ' ' + castlingToString(position, regularFENIfPossible) + ' ' + enPassantToString(position);
    result += ' ' + fiftyMoveClock + ' ' + fullMoveNumber;

    return result;
}


/**
 * @param regularFENIfPossible - For Chess960, if `true`, format the flags as `KQkq` (regular FEN style) if possible
 *                               (instead of `AB...Hab...h` which is used by default, i.e. X-FEN style).
 *                               For the other variants, this flag has no effect, as regulary FEN style is always used.
 */
function castlingToString(position: PositionImpl, regularFENIfPossible = false) {
    refreshEffectiveCastling(position);
    if (position.variant === GameVariantImpl.CHESS960) {
        if (regularFENIfPossible) {
            const whiteRegularFlags = regularFENCaslingFlagIfPossible(position, ColorImpl.WHITE);
            const blackRegularFlags = regularFENCaslingFlagIfPossible(position, ColorImpl.BLACK);
            if (whiteRegularFlags !== false && blackRegularFlags !== false) {
                return whiteRegularFlags === '' && blackRegularFlags === '' ? '-' : whiteRegularFlags.toUpperCase() + blackRegularFlags;
            }
        }
        let whiteFlags = '';
        let blackFlags = '';
        for (let file = 0; file < 8; ++file) {
            if (position.effectiveCastling![ColorImpl.WHITE] & 1 << file) { whiteFlags += fileToString(file); }
            if (position.effectiveCastling![ColorImpl.BLACK] & 1 << file) { blackFlags += fileToString(file); }
        }
        return whiteFlags === '' && blackFlags === '' ? '-' : whiteFlags.toUpperCase() + blackFlags;
    }
    else {
        let result = '';
        if (position.effectiveCastling![ColorImpl.WHITE] & 0x80) { result += 'K'; }
        if (position.effectiveCastling![ColorImpl.WHITE] & 0x01) { result += 'Q'; }
        if (position.effectiveCastling![ColorImpl.BLACK] & 0x80) { result += 'k'; }
        if (position.effectiveCastling![ColorImpl.BLACK] & 0x01) { result += 'q'; }
        return result === '' ? '-' : result;
    }
}


function regularFENCaslingFlagIfPossible(position: PositionImpl, color: number): string | false {

    // Decompose the castling flags into:
    //
    // +---------------+---+--------------+
    // | queenSideMask | 0 | kingSideMask |
    // +---------------+---+--------------+
    //   ^               ^              ^
    // File a        King file        File h
    //
    const kingFileMask = 1 << (position.king[color] % 16);
    const kingSideMask = position.effectiveCastling![color] & ~(kingFileMask | (kingFileMask - 1));
    const queenSideMask = position.effectiveCastling![color] & (kingFileMask - 1);
    let fenFlag = '';
    const firstSquare = 112 * color;
    const lastSquare = 112 * color + 7;
    const targetRook = PieceImpl.ROOK * 2 + color;

    // Search for the rooks on king-side.
    if (kingSideMask !== 0) {
        let rookFound = false;
        for (let sq = position.king[color] + 1; sq <= lastSquare; ++sq) {
            if (position.board[sq] === targetRook) {
                if (rookFound) { // Ensure there is only 1 rook on the king side.
                    return false;
                }
                else {
                    rookFound = true;
                }
            }
        }
        fenFlag += 'k';
    }

    // Search for the rooks on queen-side.
    if (queenSideMask !== 0) {
        let rookFound = false;
        for (let sq = position.king[color] - 1; sq >= firstSquare; --sq) {
            if (position.board[sq] === targetRook) {
                if (rookFound) { // Ensure there is only 1 rook on the queen side.
                    return false;
                }
                else {
                    rookFound = true;
                }
            }
        }
        fenFlag += 'q';
    }

    return fenFlag;
}


function enPassantToString(position: PositionImpl) {
    refreshEffectiveEnPassant(position);
    return position.effectiveEnPassant! < 0 ? '-' : fileToString(position.effectiveEnPassant!) + EN_PASSANT_RANK[position.turn];
}


export function parseFEN(variant: number, fen: string, strict: boolean): { position: PositionImpl, fiftyMoveClock: number, fullMoveNumber: number } {

    // Trim the input string and split it into 6 fields.
    const fields = strict ? fen.split(' ') : fen.replace(/^\s+|\s+$/g, '').split(/\s+/);
    if (fields.length !== 6) {
        throw new InvalidFEN(fen, i18n.WRONG_NUMBER_OF_FEN_FIELDS);
    }

    // The first field (that represents the board) is split in 8 sub-fields.
    const rankFields = fields[0].split('/');
    if (rankFields.length !== 8) {
        throw new InvalidFEN(fen, i18n.WRONG_NUMBER_OF_SUBFIELDS_IN_BOARD_FIELD);
    }

    // Initialize the position
    const position = makeEmpty(variant);
    position.legal = null;
    position.effectiveCastling = null;
    position.effectiveEnPassant = null;

    // Board parsing
    for (let r = 7; r >= 0; --r) {
        const rankField = rankFields[7 - r];
        let i = 0;
        let c = 0;
        while (i < rankField.length && c < 8) {
            const s = rankField[i];
            const cp = FEN_PIECE_SYMBOL.indexOf(s);

            // The current character is in the range [1-8] -> skip the corresponding number of squares.
            if (/^[1-8]$/.test(s)) {
                c += parseInt(s, 10);
            }

            // The current character corresponds to a colored piece symbol -> set the current square accordingly.
            else if (cp >= 0) {
                position.board[r * 16 + c] = cp;
                ++c;
            }

            // Otherwise -> parsing error.
            else {
                throw new InvalidFEN(fen, i18n.UNEXPECTED_CHARACTER_IN_BOARD_FIELD, s);
            }

            // Increment the character counter.
            ++i;
        }

        // Ensure that the current sub-field deals with all the squares of the current rank.
        if (i !== rankField.length || c !== 8) {
            throw new InvalidFEN(fen, i18n.UNEXPECTED_END_OF_SUBFIELD_IN_BOARD_FIELD, 8 - r);
        }
    }

    // Turn parsing
    position.turn = colorFromString(fields[1]);
    if (position.turn < 0) {
        throw new InvalidFEN(fen, i18n.INVALID_TURN_FIELD);
    }

    // Castling rights parsing
    const castling = variant === GameVariantImpl.CHESS960 ? castlingFromStringXFEN(fields[2], strict, position.board) : castlingFromStringFEN(fields[2], strict);
    if (castling === null) {
        throw new InvalidFEN(fen, i18n.INVALID_CASTLING_FIELD);
    }
    else {
        position.castling = castling;
    }

    // En-passant rights parsing
    const enPassantField = fields[3];
    if (enPassantField !== '-') {
        if (!/^[a-h][36]$/.test(enPassantField)) {
            throw new InvalidFEN(fen, i18n.INVALID_EN_PASSANT_FIELD);
        }
        position.enPassant = fileFromString(enPassantField[0]);
        if (strict) {
            if (enPassantField[1] !== EN_PASSANT_RANK[position.turn]) {
                throw new InvalidFEN(fen, i18n.WRONG_RANK_IN_EN_PASSANT_FIELD);
            }
            refreshEffectiveEnPassant(position);
            if (position.enPassant !== position.effectiveEnPassant) {
                throw new InvalidFEN(fen, i18n.INEFFECTIVE_EN_PASSANT_FIELD, fileToString(position.enPassant));
            }
        }
    }

    // Move counting flags parsing
    const moveCountingRegex = strict ? /^(?:0|[1-9][0-9]*)$/ : /^[0-9]+$/;
    if (!moveCountingRegex.test(fields[4])) {
        throw new InvalidFEN(fen, i18n.INVALID_HALF_MOVE_COUNT_FIELD);
    }
    if (!moveCountingRegex.test(fields[5])) {
        throw new InvalidFEN(fen, i18n.INVALID_MOVE_NUMBER_FIELD);
    }
    return { position: position, fiftyMoveClock: parseInt(fields[4], 10), fullMoveNumber: parseInt(fields[5], 10) };
}


function castlingFromStringFEN(castling: string, strict: boolean): number[] | null {
    const result = [ 0, 0 ];
    if (castling === '-') {
        return result;
    }
    if (!(strict ? /^K?Q?k?q?$/ : /^[KQkq]*$/).test(castling)) {
        return null;
    }
    if (castling.indexOf('K') >= 0) { result[ColorImpl.WHITE] |= 1 << 7; }
    if (castling.indexOf('Q') >= 0) { result[ColorImpl.WHITE] |= 1 << 0; }
    if (castling.indexOf('k') >= 0) { result[ColorImpl.BLACK] |= 1 << 7; }
    if (castling.indexOf('q') >= 0) { result[ColorImpl.BLACK] |= 1 << 0; }
    return result;
}


function castlingFromStringXFEN(castling: string, strict: boolean, board: number[]): number[] | null {
    const result = [ 0, 0 ];
    if (castling === '-') {
        return result;
    }
    if (!(strict ? /^[A-H]{0,2}[a-h]{0,2}$/ : /^[A-Ha-h]*|[KQkq]*$/).test(castling)) {
        return null;
    }

    function searchQueenSideRook(color: number) {
        const targetRook = PieceImpl.ROOK * 2 + color;
        const targetKing = PieceImpl.KING * 2 + color;
        for (let sq = 112 * color; sq < 112 * color + 8; ++sq) {
            if (board[sq] === targetRook) {
                return sq % 8;
            }
            else if (board[sq] === targetKing) {
                break;
            }
        }
        return 0;
    }

    function searchKingSideRook(color: number) {
        const targetRook = PieceImpl.ROOK * 2 + color;
        const targetKing = PieceImpl.KING * 2 + color;
        for (let sq = 112 * color + 7; sq >= 112 * color; --sq) {
            if (board[sq] === targetRook) {
                return sq % 8;
            }
            else if (board[sq] === targetKing) {
                break;
            }
        }
        return 7;
    }

    if (!strict) {
        if (castling.indexOf('K') >= 0) { result[ColorImpl.WHITE] |= 1 << searchKingSideRook (ColorImpl.WHITE); }
        if (castling.indexOf('Q') >= 0) { result[ColorImpl.WHITE] |= 1 << searchQueenSideRook(ColorImpl.WHITE); }
        if (castling.indexOf('k') >= 0) { result[ColorImpl.BLACK] |= 1 << searchKingSideRook (ColorImpl.BLACK); }
        if (castling.indexOf('q') >= 0) { result[ColorImpl.BLACK] |= 1 << searchQueenSideRook(ColorImpl.BLACK); }
    }

    for (let file = 0; file < 8; ++file) {
        const s = fileToString(file);
        if (castling.indexOf(s.toUpperCase()) >= 0) { result[ColorImpl.WHITE] |= 1 << file; }
        if (castling.indexOf(s) >= 0) { result[ColorImpl.BLACK] |= 1 << file; }
    }
    return result;
}
