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


/**
 * @module i18n
 * @description This module defines the localizable strings used by the library.
 */



// Ordinal integers (from 1 to 8).
exports.ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

// FEN parsing error messages
exports.WRONG_NUMBER_OF_FEN_FIELDS                = 'A FEN string must contain exactly 6 space-separated fields.';
exports.WRONG_NUMBER_OF_SUBFIELDS_IN_BOARD_FIELD  = 'The 1st field of a FEN string must contain exactly 8 `/`-separated subfields.';
exports.UNEXPECTED_CHARACTER_IN_BOARD_FIELD       = 'Unexpected character in the 1st field of the FEN string: `%1$s`.';
exports.UNEXPECTED_END_OF_SUBFIELD_IN_BOARD_FIELD = 'The %1$s subfield of the FEN string 1st field is unexpectedly short.';
exports.INVALID_TURN_FIELD                        = 'The 2nd field of a FEN string must be either `w` or `b`.';
exports.INVALID_CASTLING_FIELD                    = 'The 3rd field of a FEN string must be either `-` or a list of characters among `K`, `Q`, `k` and `q` (in this order).';
exports.INVALID_EN_PASSANT_FIELD                  = 'The 4th field of a FEN string must be either `-` or a square from the 3rd or 6th rank where en-passant is allowed.';
exports.WRONG_RANK_IN_EN_PASSANT_FIELD            = 'The rank number indicated in the FEN string 4th field is inconsistent with respect to the 2nd field.';
exports.INVALID_MOVE_COUNTING_FIELD               = 'The %1$s field of a FEN string must be a number.';
exports.INVALID_VARIANT_PREFIX                    = 'Invalid variant prefix: `%1$s`.';

// Notation & UCI parsing error messages
exports.INVALID_UCI_NOTATION_SYNTAX         = 'The syntax of the UCI notation is invalid.';
exports.ILLEGAL_UCI_MOVE                    = 'The UCI move is not legal.';
exports.INVALID_MOVE_NOTATION_SYNTAX        = 'The syntax of the move notation is invalid.';
exports.ILLEGAL_POSITION                    = 'The position is not legal.';
exports.ILLEGAL_NO_KING_CASTLING            = 'Casting is not legal in the considered position as it has no king.';
exports.ILLEGAL_QUEEN_SIDE_CASTLING         = 'Queen-side castling is not legal in the considered position.';
exports.ILLEGAL_KING_SIDE_CASTLING          = 'King-side castling is not legal in the considered position.';
exports.NO_PIECE_CAN_MOVE_TO                = 'No %1$s can move to %2$s.';
exports.NO_PIECE_CAN_MOVE_TO_DISAMBIGUATION = 'No %1$s on the specified rank/file can move to %2$s.';
exports.REQUIRE_DISAMBIGUATION              = 'Cannot determine uniquely which %1$s is supposed to move to %2$s.';
exports.WRONG_DISAMBIGUATION_SYMBOL         = 'Wrong disambiguation symbol (expected: `%1$s`, observed: `%2$s`).';
exports.TRYING_TO_CAPTURE_YOUR_OWN_PIECES   = 'Capturing its own pieces is not legal.';
exports.INVALID_PIECE_SYMBOL                = 'Character `%1$s` is not a valid piece symbol.';
exports.INVALID_PIECE_SYMBOL_COLOR          = 'Invalid color for piece symbol `%1$s`.';
exports.INVALID_CAPTURING_PAWN_MOVE         = 'Invalid capturing pawn move.';
exports.INVALID_NON_CAPTURING_PAWN_MOVE     = 'Invalid non-capturing pawn move.';
exports.NOT_SAFE_FOR_WHITE_KING             = 'This move would put let the white king in check.';
exports.NOT_SAFE_FOR_BLACK_KING             = 'This move would put let the black king in check.';
exports.MISSING_PROMOTION                   = 'A promoted piece must be specified for this move.';
exports.MISSING_PROMOTION_SYMBOL            = 'Character `=` is required to specify a promoted piece.';
exports.INVALID_PROMOTED_PIECE              = '%1$s cannot be specified as a promoted piece.';
exports.ILLEGAL_PROMOTION                   = 'Specifying a promoted piece is illegal for this move.';
exports.ILLEGAL_NULL_MOVE                   = 'Cannot play a null-move in this position.';
exports.MISSING_CAPTURE_SYMBOL              = 'Capture symbol `x` is missing.';
exports.INVALID_CAPTURE_SYMBOL              = 'This move is not a capture move.';
exports.WRONG_CHECK_CHECKMATE_SYMBOL        = 'Wrong check/checkmate symbol (expected: `%1$s`, observed: `%2$s`).';

// PGN parsing error messages
exports.INVALID_PGN_TOKEN               = 'Unrecognized character or group of characters.';
exports.INVALID_MOVE_IN_PGN_TEXT        = 'Invalid move (%1$s). %2$s';
exports.INVALID_FEN_IN_PGN_TEXT         = 'Invalid FEN string in the initial position header. %1$s';
exports.UNEXPECTED_PGN_HEADER           = 'Unexpected PGN game header.';
exports.MISSING_PGN_HEADER_ID           = 'Missing or invalid PGN game header ID.';
exports.MISSING_PGN_HEADER_VALUE        = 'Missing or invalid PGN game header value.';
exports.MISSING_END_OF_PGN_HEADER       = 'Missing or invalid end of PGN game header.';
exports.UNEXPECTED_BEGIN_OF_VARIATION   = 'Unexpected begin of variation.';
exports.UNEXPECTED_END_OF_VARIATION     = 'Unexpected end of variation.';
exports.UNEXPECTED_END_OF_GAME          = 'Unexpected end of game: there are pending variations.';
exports.UNEXPECTED_END_OF_TEXT          = 'Unexpected end of text: there is a pending game.';
exports.INVALID_GAME_INDEX              = 'Game index %1$s is invalid (only %2$s game(s) found in the PGN data).';
exports.UNKNOWN_VARIANT                 = 'Unknown chess game variant (%1$s).';
exports.VARIANT_WITHOUT_FEN             = 'For non-standard game variant, the FEN header is mandatory.';
