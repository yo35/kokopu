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


export { i18n } from './i18n';
export * as exception from './exception';

export { Color, Piece, ColoredPiece, File, Rank, Square, SquareCouple, Castle, Castle960, Coordinates, GameResult, GameVariant } from './base_types';
export { isColor, isPiece, isColoredPiece, isFile, isRank, isSquare, isSquareCouple, isCastle, isCastle960, isGameResult, isGameVariant, forEachSquare,
	squareColor, squareToCoordinates, coordinatesToSquare, oppositeColor, variantWithCanonicalStartPosition, nagSymbol, isValidECO } from './helper';
export { DateValue } from './date_value';

export { MoveDescriptor, isMoveDescriptor } from './move_descriptor';
export { Position, RegularMoveFactory, PromotionMoveFactory } from './position';
export { AbstractNode, Node, Variation } from './node_variation';
export { GamePOJO, PlayerPOJO, AbstractNodePOJO, NodePOJO, VariationPOJO } from './game_pojo';
export { Game } from './game';
export { Database } from './database';

export { PGNWriteOptions } from './private_pgn/pgn_write_impl';
export { pgnRead, pgnWrite } from './pgn';
