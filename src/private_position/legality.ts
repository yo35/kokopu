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


import { isAttacked } from './attacks';
import { ColorImpl, PieceImpl, CpI, SpI, SquareImpl, GameVariantImpl } from './base_types_impl';
import { PositionImpl } from './impl';


/**
 * Check whether the given position is legal or not.
 *
 * See {@link Position.isLegal} for the description of the check points enforced in this function.
 */
export function isLegal(position: PositionImpl): boolean {
    refreshLegalFlagAndKingSquares(position);
    return position.legal!;
}


/**
 * Refresh the legal flag of the given position if it is set to null
 * (which means that the legality state of the position is unknown).
 *
 * Together with the legal flag, the reference to the squares where the white and
 * black kings lie is updated by this function.
 */
export function refreshLegalFlagAndKingSquares(position: PositionImpl) {
    if (position.legal !== null) {
        return;
    }
    position.legal = false;

    // Condition (1)
    const whiteKingOK = refreshKingSquare(position, ColorImpl.WHITE);
    const blackKingOK = refreshKingSquare(position, ColorImpl.BLACK);
    if (!whiteKingOK || !blackKingOK) {
        return;
    }

    // Extension of (1) for variants that allow a player to have no piece at all...
    if (position.variant === GameVariantImpl.ANTICHESS) {
        if (!hasAtLeastOnePiece(position, 1 - position.turn)) { // The player that has just played must have at least one piece in antichess.
            return;
        }
    }
    else if (position.variant === GameVariantImpl.HORDE) {
        if (position.turn === ColorImpl.BLACK && !hasAtLeastOnePiece(position, ColorImpl.WHITE)) { // White must have at least one piece if he/she has just played in horde chess.
            return;
        }
    }

    // Condition (2)
    if (position.king[1 - position.turn] >= 0 && isAttacked(position, position.king[1 - position.turn], position.turn)) {
        return;
    }

    // Condition (3)
    const forbiddenCPWhite1 = position.variant === GameVariantImpl.HORDE ? SpI.INVALID : CpI.WP;
    for (let c = 0; c < 8; ++c) {
        const cp1 = position.board[SquareImpl.A1 + c];
        const cp8 = position.board[SquareImpl.A8 + c];
        if (cp1 === forbiddenCPWhite1 || cp8 === CpI.WP || cp1 === CpI.BP || cp8 === CpI.BP) {
            return;
        }
    }

    // At this point, all the conditions (1) to (4) hold, so the position can be flagged as legal.
    position.legal = true;
}


/**
 * Detect the kings of the given color that are present on the chess board.
 *
 * @returns `true` if the number of found king(s) corresponds is compatible with a legal position according to the given variant.
 */
function refreshKingSquare(position: PositionImpl, color: number) {
    const target = PieceImpl.KING * 2 + color;
    position.king[color] = -1;

    // Expectation: king may be present (even several times), and it has no royal power.
    if (position.variant === GameVariantImpl.ANTICHESS) {
        return true;
    }

    // Expectation: no king of the given color is supposed to be present on the board.
    else if (position.variant === GameVariantImpl.NO_KING || position.variant === GameVariantImpl.BLACK_KING_ONLY - color ||
        (position.variant === GameVariantImpl.HORDE && color === ColorImpl.WHITE)) {
        for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
            if (position.board[sq] === target) {
                return false;
            }
        }
        return true;
    }

    // Expectation: exactly 1 king of the given color is supposed to be present on the board, and it has royal power.
    else {
        for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
            if (position.board[sq] === target) {

                // If the targeted king is detected on the square sq, two situations may occur:
                // 1) No king was detected on the previously visited squares: then the current
                //    square is saved, and loop over the next board squares goes on.
                if (position.king[color] < 0) {
                    position.king[color] = sq;
                }

                // 2) Another king was detected on the previously visited squares: then the buffer position.king[color]
                //    is set to the invalid state (-1), and the loop is interrupted.
                else {
                    position.king[color] = -1;
                    return false;
                }
            }
        }
        return position.king[color] >= 0;
    }
}


/**
 * Detect whether the player with the given color has at least one piece or not.
 */
function hasAtLeastOnePiece(position: PositionImpl, color: number) {
    for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
        if (position.board[sq] !== SpI.EMPTY && position.board[sq] % 2 === color) {
            return true;
        }
    }
    return false;
}


/**
 * Check whether the current player king is in check after moving from `from` to `to`.
 *
 * This function implements the verification steps (7) to (9) as defined in {@link isMoveLegal}.
 *
 * Precondition: {@link refreshLegalFlagAndKingSquares} must have been invoked beforehand.
 *
 * @param enPassantSquare - Index of the square where the "en-passant" taken pawn lies if any, `-1` otherwise.
 */
export function isKingSafeAfterMove(position: PositionImpl, from: number, to: number, enPassantSquare = -1) {
    if (position.king[position.turn] < 0) {
        return true;
    }

    const fromContent = position.board[from];
    const toContent = position.board[to];
    const movingPiece = Math.trunc(fromContent / 2);

    // Step (7) -> Execute the displacement (castling moves are processed separately).
    position.board[to] = fromContent;
    position.board[from] = SpI.EMPTY;
    if (enPassantSquare >= 0) {
        position.board[enPassantSquare] = SpI.EMPTY;
    }

    // Step (8) -> Is the king safe after the displacement?
    try {
        return !isAttacked(position, movingPiece === PieceImpl.KING ? to : position.king[position.turn], 1 - position.turn);
    }

    // Step (9) -> Reverse the displacement.
    finally {
        position.board[from] = fromContent;
        position.board[to] = toContent;
        if (enPassantSquare >= 0) {
            position.board[enPassantSquare] = PieceImpl.PAWN * 2 + 1 - position.turn;
        }
    }
}


/**
 * Refresh the effective castling flags of the given position if they are set to null
 * (which means that their states are unknown).
 */
export function refreshEffectiveCastling(position: PositionImpl) {
    if (position.effectiveCastling !== null) {
        return;
    }

    // Detect the location of the king and make sure it has royal power.
    // (no royal power, no castling...)
    refreshLegalFlagAndKingSquares(position);

    // Actual computation.
    position.effectiveCastling = position.variant === GameVariantImpl.CHESS960 ?
        [ computeEffectiveCastlingForChess960(position, 0), computeEffectiveCastlingForChess960(position, 1) ] :
        [ computeEffectiveCastlingForRegularChess(position, 0), computeEffectiveCastlingForRegularChess(position, 1) ];
}


function computeEffectiveCastlingForRegularChess(position: PositionImpl, color: number) {
    const rankOffset = 112 * color;
    if (position.king[color] !== rankOffset + 4 || position.castling[color] === 0) {
        return 0;
    }
    const targetRook = PieceImpl.ROOK * 2 + color;
    let result = 0;
    if ((position.castling[color] & 0x01) !== 0 && position.board[rankOffset] === targetRook) { // queen-side castling
        result |= 0x01;
    }
    if ((position.castling[color] & 0x80) !== 0 && position.board[rankOffset + 7] === targetRook) { // king-side castling
        result |= 0x80;
    }
    return result;
}


function computeEffectiveCastlingForChess960(position: PositionImpl, color: number) {
    const rankOffset = 112 * color;
    if (position.king[color] <= rankOffset || position.king[color] >= rankOffset + 7 || position.castling[color] === 0) { // The king must not be in the corners.
        return 0;
    }

    const targetRook = PieceImpl.ROOK * 2 + color;
    let result = 0;

    // Queen-side castling.
    let queenSideRookFile = -1;
    for (let file = position.king[color] % 16 - 1; file >= 0; --file) {
        if ((position.castling[color] & 1 << file) === 0 || position.board[rankOffset + file] !== targetRook) {
            continue;
        }
        if (queenSideRookFile < 0) {
            queenSideRookFile = file;
        }
        else {
            queenSideRookFile = -1;
            break;
        }
    }
    if (queenSideRookFile >= 0) {
        result |= 1 << queenSideRookFile;
    }

    // King-side castling.
    let kingSideRookFile = -1;
    for (let file = position.king[color] % 16 + 1; file < 8; ++file) {
        if ((position.castling[color] & 1 << file) === 0 || position.board[rankOffset + file] !== targetRook) {
            continue;
        }
        if (kingSideRookFile < 0) {
            kingSideRookFile = file;
        }
        else {
            kingSideRookFile = -1;
            break;
        }
    }
    if (kingSideRookFile >= 0) {
        result |= 1 << kingSideRookFile;
    }

    return result;
}


/**
 * Refresh the effective en-passant flag of the given position if it is set to null
 * (which means that its state is unknown).
 */
export function refreshEffectiveEnPassant(position: PositionImpl) {
    if (position.effectiveEnPassant !== null) {
        return;
    }
    position.effectiveEnPassant = -1;

    // If the en-passant flag is unset, so is the effective en-passant flag.
    if (position.enPassant < 0) {
        return;
    }

    // Geometric condition: for the effective en-passant flag to be set for instance to file E, assuming black is about to play:
    // - e2 and e3 must be empty,
    // - there must be a white pawn on e4,
    // - and there must be at least one black pawn on d4 or f4.
    const square2 = (6 - position.turn * 5) * 16 + position.enPassant;
    const square3 = (5 - position.turn * 3) * 16 + position.enPassant;
    const square4 = (4 - position.turn) * 16 + position.enPassant;
    const capturingPawn = PieceImpl.PAWN * 2 + position.turn;
    const capturedPawn = PieceImpl.PAWN * 2 + 1 - position.turn;
    if (position.board[square2] !== SpI.EMPTY || position.board[square3] !== SpI.EMPTY || position.board[square4] !== capturedPawn) {
        return;
    }
    const hasCapturingPawnBefore = ((square4 - 1) & 0x88) === 0 && position.board[square4 - 1] === capturingPawn;
    const hasCapturingPawnAfter = ((square4 + 1) & 0x88) === 0 && position.board[square4 + 1] === capturingPawn;
    if (!hasCapturingPawnBefore && !hasCapturingPawnAfter) {
        return;
    }

    // If en-passant is geometrically valid, ensure that it do not let the king in check.
    refreshLegalFlagAndKingSquares(position);
    if (
        !(hasCapturingPawnBefore && isKingSafeAfterMove(position, square4 - 1, square3, square4)) &&
        !(hasCapturingPawnAfter && isKingSafeAfterMove(position, square4 + 1, square3, square4))
    ) {
        return;
    }

    // At this point, the en-passant flag can be considered as effective.
    position.effectiveEnPassant = position.enPassant;
}


export function isEqual(pos1: PositionImpl, pos2: PositionImpl) {
    if (pos1.turn !== pos2.turn || pos1.variant !== pos2.variant) {
        return false;
    }
    for (let sq = 0; sq < 120; sq += (sq & 0x7) === 7 ? 9 : 1) {
        if (pos1.board[sq] !== pos2.board[sq]) {
            return false;
        }
    }

    // No check on `.legal` and `.king` as they are computed attributes.

    // Ignore `.castling`, compare `.effectiveCastling` instead.
    refreshEffectiveCastling(pos1);
    refreshEffectiveCastling(pos2);
    if (
        pos1.effectiveCastling![ColorImpl.WHITE] !== pos2.effectiveCastling![ColorImpl.WHITE] ||
        pos1.effectiveCastling![ColorImpl.BLACK] !== pos2.effectiveCastling![ColorImpl.BLACK]
    ) {
        return false;
    }

    // Ignore `.enPassant`, compare `.effectiveEnPassant` instead.
    refreshEffectiveEnPassant(pos1);
    refreshEffectiveEnPassant(pos2);
    return pos1.effectiveEnPassant === pos2.effectiveEnPassant;
}
