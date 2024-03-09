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


import { GameResult, GameVariant } from './base_types';


/**
 * Represent the player-related headers in a {@link GamePOJO}.
 */
export type PlayerPOJO = {
    name?: string;
    elo?: number;
    title?: string;
};


/**
 * Represent a {@link Game} as a [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object),
 * thus allowing JSON serialization, deep cloning, etc...
 */
export type GamePOJO = {

    // Headers
    white?: PlayerPOJO;
    black?: PlayerPOJO;
    event?: string;
    round?: number;
    subRound?: number;
    subSubRound?: number;
    date?: string;
    site?: string;
    annotator?: string;
    eco?: string;
    opening?: string;
    openingVariation?: string;
    openingSubVariation?: string;
    termination?: string;
    result?: GameResult;

    // Moves
    variant?: GameVariant;
    initialPosition?: string;
    mainVariation?: VariationPOJO;
};


/**
 * Represent a {@link AbstractNode} in a {@link GamePOJO}.
 */
export type AbstractNodePOJO = {
    comment?: string;
    isLongComment?: boolean;
    nags?: number[];
    tags?: Record<string, string>;
};


/**
 * Represent a {@link Node} in a {@link GamePOJO}.
 */
export type NodePOJO = string | AbstractNodePOJO & {
    notation: string;
    variations?: VariationPOJO[];
};


/**
 * Represent a {@link Variation} in a {@link GamePOJO}.
 */
export type VariationPOJO = NodePOJO[] | AbstractNodePOJO & {
    nodes: NodePOJO[];
    isLongVariation?: boolean;
};
