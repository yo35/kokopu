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


export { i18n } from './i18n';
export * as exception from './exception';

export { Color, Piece, ColoredPiece, Castle, Castle960, File, Rank, Square, Coordinates, GameResult, GameVariant } from './base_types';
export { forEachSquare, squareColor, squareToCoordinates, coordinatesToSquare, oppositeColor, variantWithCanonicalStartPosition, nagSymbol } from './helper';
export { DateValue } from './date_value';

export { MoveDescriptor, isMoveDescriptor } from './move_descriptor';
export { Position, RegularMoveFactory, PromotionMoveFactory } from './position';
export { AbstractNode, Node, Variation } from './node_variation';
export { Game } from './game';
export { Database } from './database';

export { pgnRead, pgnWrite } from './pgn';