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


/**
 * This module defines the localizable strings used by the library.
 */
export namespace i18n {

// FEN parsing error messages
export let WRONG_NUMBER_OF_FEN_FIELDS                = 'A FEN string must contain exactly 6 space-separated fields.';
export let WRONG_NUMBER_OF_SUBFIELDS_IN_BOARD_FIELD  = 'The 1st field of a FEN string must contain exactly 8 `/`-separated subfields.';
export let UNEXPECTED_CHARACTER_IN_BOARD_FIELD       = 'Unexpected character in the 1st field of the FEN string: `{0}`.';
export let UNEXPECTED_END_OF_SUBFIELD_IN_BOARD_FIELD = 'Subfield {0} of the FEN string 1st field is unexpectedly short.';
export let INVALID_TURN_FIELD                        = 'The 2nd field of a FEN string must be either `w` or `b`.';
export let INVALID_CASTLING_FIELD                    = 'The 3rd field of a FEN string must be either `-` or a list of characters among `K`, `Q`, `k` and `q` (in this order).';
export let INVALID_EN_PASSANT_FIELD                  = 'The 4th field of a FEN string must be either `-` or a square from the 3rd or 6th rank where en-passant is allowed.';
export let WRONG_RANK_IN_EN_PASSANT_FIELD            = 'The rank number indicated in the FEN string 4th field is inconsistent with respect to the 2nd field.';
export let INVALID_HALF_MOVE_COUNT_FIELD             = 'The 5th field of a FEN string must be a number, indicating the number of half-move since the last pawn move or capture.';
export let INVALID_MOVE_NUMBER_FIELD                 = 'The 6th field of a FEN string must be a number, indicating the move number of the game.';
export let INVALID_VARIANT_PREFIX                    = 'Invalid variant prefix: `{0}`.';

// Notation & UCI parsing error messages
export let INVALID_UCI_NOTATION_SYNTAX         = 'The syntax of the UCI notation is invalid.';
export let ILLEGAL_UCI_MOVE                    = 'The UCI move is not legal.';
export let INVALID_MOVE_NOTATION_SYNTAX        = 'The syntax of the move notation is invalid.';
export let ILLEGAL_POSITION                    = 'The position is not legal.';
export let ILLEGAL_NO_KING_CASTLING            = 'Casting is not legal in the considered position as it has no king.';
export let ILLEGAL_QUEEN_SIDE_CASTLING         = 'Queen-side castling is not legal in the considered position.';
export let ILLEGAL_KING_SIDE_CASTLING          = 'King-side castling is not legal in the considered position.';
export let NO_PIECE_CAN_MOVE_TO                = 'No {0} can move to {1}.';
export let NO_PIECE_CAN_MOVE_TO_DISAMBIGUATION = 'No {0} on the specified rank/file can move to {1}.';
export let REQUIRE_DISAMBIGUATION              = 'Cannot determine uniquely which {0} is supposed to move to {1}.';
export let WRONG_DISAMBIGUATION_SYMBOL         = 'Wrong disambiguation symbol (expected: `{0}`, observed: `{1}`).';
export let TRYING_TO_CAPTURE_YOUR_OWN_PIECES   = 'Capturing its own pieces is not legal.';
export let CAPTURE_IS_MANDATORY                = 'Capture is mandatory.';
export let INVALID_PIECE_SYMBOL                = 'Character `{0}` is not a valid piece symbol.';
export let INVALID_PIECE_SYMBOL_COLOR          = 'Invalid color for piece symbol `{0}`.';
export let INVALID_CAPTURING_PAWN_MOVE         = 'Invalid capturing pawn move.';
export let INVALID_NON_CAPTURING_PAWN_MOVE     = 'Invalid non-capturing pawn move.';
export let NOT_SAFE_FOR_WHITE_KING             = 'This move would let the white king in check.';
export let NOT_SAFE_FOR_BLACK_KING             = 'This move would let the black king in check.';
export let MISSING_PROMOTION                   = 'A promoted piece must be specified for this move.';
export let MISSING_PROMOTION_SYMBOL            = 'Character `=` is required to specify a promoted piece.';
export let INVALID_PROMOTED_PIECE              = '{0} cannot be specified as a promoted piece.';
export let ILLEGAL_PROMOTION                   = 'Specifying a promoted piece is illegal for this move.';
export let ILLEGAL_NULL_MOVE                   = 'Cannot play a null-move in this position.';
export let MISSING_CAPTURE_SYMBOL              = 'Capture symbol `x` is missing.';
export let INVALID_CAPTURE_SYMBOL              = 'This move is not a capture move.';
export let WRONG_CHECK_CHECKMATE_SYMBOL        = 'Wrong check/checkmate symbol (expected: `{0}`, observed: `{1}`).';

// PGN parsing error messages
export let INVALID_PGN_TOKEN             = 'Unrecognized character or group of characters.';
export let INVALID_MOVE_IN_PGN_TEXT      = 'Invalid move ({0}). {1}';
export let INVALID_FEN_IN_PGN_TEXT       = 'Invalid FEN string in the initial position header. {0}';
export let UNEXPECTED_PGN_HEADER         = 'Unexpected PGN game header.';
export let MISSING_PGN_HEADER_ID         = 'Missing or invalid PGN game header ID.';
export let MISSING_PGN_HEADER_VALUE      = 'Missing or invalid PGN game header value.';
export let MISSING_END_OF_PGN_HEADER     = 'Missing or invalid end of PGN game header.';
export let UNEXPECTED_BEGIN_OF_VARIATION = 'Unexpected begin of variation.';
export let UNEXPECTED_END_OF_VARIATION   = 'Unexpected end of variation.';
export let UNEXPECTED_END_OF_GAME        = 'Unexpected end of game: there are pending variations.';
export let UNEXPECTED_END_OF_TEXT        = 'Unexpected end of text: there is a pending game.';
export let INVALID_GAME_INDEX            = 'Game index {0} is invalid (only {1} game(s) found in the PGN data).';
export let UNKNOWN_VARIANT               = 'Unknown chess game variant ({0}).';
export let VARIANT_WITHOUT_FEN           = 'For game variant {0}, the FEN header is mandatory.';

}
