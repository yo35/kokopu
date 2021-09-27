/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2021  Yoann Le Montagner <yo35 -at- melix.net>       *
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
 ******************************************************************************/


'use strict';


exports.i18n = require('./i18n');
exports.exception = require('./exception');

var helper = require('./helper');
exports.forEachSquare = helper.forEachSquare;
exports.squareColor = helper.squareColor;
exports.squareToCoordinates = helper.squareToCoordinates;
exports.coordinatesToSquare = helper.coordinatesToSquare;
exports.oppositeColor = helper.oppositeColor;
exports.variantWithCanonicalStartPosition = helper.variantWithCanonicalStartPosition;

exports.isMoveDescriptor = require('./movedescriptor').isMoveDescriptor;

exports.Position = require('./position').Position;
exports.Game = require('./game').Game;

var pgn = require('./pgn');
exports.pgnRead = pgn.pgnRead;
exports.pgnWrite = pgn.pgnWrite;
