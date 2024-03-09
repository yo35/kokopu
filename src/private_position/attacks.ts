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


import { PieceImpl, SpI } from './base_types_impl';
import { PositionImpl } from './impl';


/**
 * Attack directions per colored piece.
 */
export const ATTACK_DIRECTIONS = [
    [ -17, -16, -15, -1, 1, 15, 16, 17 ], // king/queen
    [ -17, -16, -15, -1, 1, 15, 16, 17 ], // king/queen
    [ -17, -16, -15, -1, 1, 15, 16, 17 ], // king/queen
    [ -17, -16, -15, -1, 1, 15, 16, 17 ], // king/queen
    [ -16, -1, 1, 16 ], // rook
    [ -16, -1, 1, 16 ], // rook
    [ -17, -15, 15, 17 ], // bishop
    [ -17, -15, 15, 17 ], // bishop
    [ -33, -31, -18, -14, 14, 18, 31, 33 ], // knight
    [ -33, -31, -18, -14, 14, 18, 31, 33 ], // knight
    [ 15, 17 ], // white pawn
    [ -17, -15 ] // black pawn
];



// -----------------------------------------------------------------------------
// isAttacked
// -----------------------------------------------------------------------------

/**
 * Check if any piece of the given color attacks a given square.
 */
export function isAttacked(position: PositionImpl, square: number, attackerColor: number) {
    return isAttackedByNonSliding(position, square, PieceImpl.KING * 2 + attackerColor) ||
        isAttackedByNonSliding(position, square, PieceImpl.KNIGHT * 2 + attackerColor) ||
        isAttackedByNonSliding(position, square, PieceImpl.PAWN * 2 + attackerColor) ||
        isAttackedBySliding(position, square, PieceImpl.ROOK * 2 + attackerColor, PieceImpl.QUEEN * 2 + attackerColor) ||
        isAttackedBySliding(position, square, PieceImpl.BISHOP * 2 + attackerColor, PieceImpl.QUEEN * 2 + attackerColor);
}


function isAttackedByNonSliding(position: PositionImpl, square: number, nonSlidingAttacker: number) {
    const directions = ATTACK_DIRECTIONS[nonSlidingAttacker];
    for (let i = 0; i < directions.length; ++i) {
        const sq = square - directions[i];
        if ((sq & 0x88) === 0 && position.board[sq] === nonSlidingAttacker) {
            return true;
        }
    }
    return false;
}


function isAttackedBySliding(position: PositionImpl, square: number, slidingAttacker: number, queenAttacker: number) {
    const directions = ATTACK_DIRECTIONS[slidingAttacker];
    for (let i = 0; i < directions.length; ++i) {
        let sq = square;
        while (true) {
            sq -= directions[i];
            if ((sq & 0x88) === 0) {
                const cp = position.board[sq];
                if (cp === SpI.EMPTY) {
                    continue;
                }
                else if (cp === slidingAttacker || cp === queenAttacker) {
                    return true;
                }
            }
            break;
        }
    }
    return false;
}



// -----------------------------------------------------------------------------
// getAttacks
// -----------------------------------------------------------------------------

/**
 * Return the squares from which a piece of the given color attacks a given square.
 */
export function getAttacks(position: PositionImpl, square: number, attackerColor: number) {
    const result: number[] = [];
    findNonSlidingAttacks(position, square, result, PieceImpl.KING * 2 + attackerColor);
    findNonSlidingAttacks(position, square, result, PieceImpl.KNIGHT * 2 + attackerColor);
    findNonSlidingAttacks(position, square, result, PieceImpl.PAWN * 2 + attackerColor);
    findSlidingAttacks(position, square, result, PieceImpl.ROOK * 2 + attackerColor, PieceImpl.QUEEN * 2 + attackerColor);
    findSlidingAttacks(position, square, result, PieceImpl.BISHOP * 2 + attackerColor, PieceImpl.QUEEN * 2 + attackerColor);
    return result;
}


function findNonSlidingAttacks(position: PositionImpl, square: number, result: number[], nonSlidingAttacker: number) {
    const directions = ATTACK_DIRECTIONS[nonSlidingAttacker];
    for (let i = 0; i < directions.length; ++i) {
        const sq = square - directions[i];
        if ((sq & 0x88) === 0 && position.board[sq] === nonSlidingAttacker) {
            result.push(sq);
        }
    }
}


function findSlidingAttacks(position: PositionImpl, square: number, result: number[], slidingAttacker: number, queenAttacker: number) {
    const directions = ATTACK_DIRECTIONS[slidingAttacker];
    for (let i = 0; i < directions.length; ++i) {
        let sq = square;
        while (true) {
            sq -= directions[i];
            if ((sq & 0x88) === 0) {
                const cp = position.board[sq];
                if (cp === SpI.EMPTY) {
                    continue;
                }
                else if (cp === slidingAttacker || cp === queenAttacker) {
                    result.push(sq);
                }
            }
            break;
        }
    }
}
