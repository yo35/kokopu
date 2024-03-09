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


/**
 * Trim the given string, and replace all the sub-sequence of 1 or several space-like characters by a single space.
 */
export function trimAndCollapseSpaces(text: string) {
    return text.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
}


/**
 * Whether the given value is a valid NAG or not.
 */
export function isValidNag(nag: unknown) {
    return Number.isInteger(nag) && (nag as number) >= 0;
}


/**
 * Whether the given value is a valid NAG or not.
 */
export function isValidElo(elo: unknown) {
    return Number.isInteger(elo) && (elo as number) >= 0;
}


/**
 * Whether the given value is a valid round (or sub-round, or sub-sub-round...) or not.
 */
export function isValidRound(round: unknown) {
    return Number.isInteger(round) && (round as number) >= 0;
}
