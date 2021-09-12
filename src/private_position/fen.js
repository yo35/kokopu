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


var bt = require('../basetypes');
var exception = require('../exception');
var i18n = require('../i18n');

var impl = require('./impl');

var FEN_PIECE_SYMBOL = 'KkQqRrBbNnPp';


/**
 * Return a human-readable string representing the position. This string is multi-line,
 * and is intended to be displayed in a fixed-width font (similarly to an ASCII-art picture).
 */
exports.ascii = function(position) {

	// Board scanning
	var result = '+---+---+---+---+---+---+---+---+\n';
	for(var r=7; r>=0; --r) {
		for(var f=0; f<8; ++f) {
			var cp = position.board[r*16 + f];
			result += '| ' + (cp < 0 ? ' ' : FEN_PIECE_SYMBOL[cp]) + ' ';
		}
		result += '|\n';
		result += '+---+---+---+---+---+---+---+---+\n';
	}

	// Flags
	result += bt.colorToString(position.turn) + ' ' + castlingToString(position) + ' ' + enPassantToString(position);
	if(position.variant !== bt.REGULAR_CHESS) {
		result += ' (' + bt.variantToString(position.variant) + ')';
	}

	return result;
};


exports.getFEN = function(position, fiftyMoveClock, fullMoveNumber, regularFENIfPossible) {
	var result = '';

	// Board scanning
	for(var r=7; r>=0; --r) {
		var emptyCount = 0;
		for(var f=0; f<8; ++f) {
			var cp = position.board[r*16 + f];
			if(cp < 0) {
				++emptyCount;
			}
			else {
				if(emptyCount > 0) {
					result += emptyCount;
					emptyCount = 0;
				}
				result += FEN_PIECE_SYMBOL[cp];
			}
		}
		if(emptyCount > 0) {
			result += emptyCount;
		}
		if(r > 0) {
			result += '/';
		}
	}

	// Flags + additional move counters
	result += ' ' + bt.colorToString(position.turn) + ' ' + castlingToString(position, regularFENIfPossible) + ' ' + enPassantToString(position);
	result += ' ' + fiftyMoveClock + ' ' + fullMoveNumber;

	return result;
};


function castlingToString(position, regularFENIfPossible) {
	if(position.variant === bt.CHESS960) {
		if (regularFENIfPossible) {
			var whiteRegularFlags = regularFENCaslingFlagIfPossible(position, bt.WHITE);
			var blackRegularFlags = regularFENCaslingFlagIfPossible(position, bt.BLACK);
			if (whiteRegularFlags !== false && blackRegularFlags !== false) {
				return whiteRegularFlags === '' && blackRegularFlags === '' ? '-' : whiteRegularFlags.toUpperCase() + blackRegularFlags;
			}
		}
		var whiteFlags = '';
		var blackFlags = '';
		for(var file = 0; file < 8; ++file) {
			if(position.castling[bt.WHITE] & 1 << file) { whiteFlags += bt.fileToString(file); }
			if(position.castling[bt.BLACK] & 1 << file) { blackFlags += bt.fileToString(file); }
		}
		return whiteFlags === '' && blackFlags === '' ? '-' : whiteFlags.toUpperCase() + blackFlags;
	}
	else {
		var result = '';
		if(position.castling[bt.WHITE] & 1<<7) { result += 'K'; }
		if(position.castling[bt.WHITE] & 1<<0) { result += 'Q'; }
		if(position.castling[bt.BLACK] & 1<<7) { result += 'k'; }
		if(position.castling[bt.BLACK] & 1<<0) { result += 'q'; }
		return result === '' ? '-' : result;
	}
}


function regularFENCaslingFlagIfPossible(position, color) {
	if (position.castling[color] === 0) {
		return '';
	}

	var firstSquare = 112 * color;
	var lastSquare = 112 * color + 7;
	var targetKing = bt.KING * 2 + color;
	var targetRook = bt.ROOK * 2 + color;

	// Search for the king
	var kingSquare = -1;
	for (var sq = firstSquare; sq <= lastSquare; ++sq) {
		if (position.board[sq] === targetKing) {
			if (kingSquare < 0) {
				kingSquare = sq;
			}
			else {
				return false;
			}
		}
	}
	if (kingSquare < 0) {
		return false;
	}

	var kingFileMask = 1 << (kingSquare % 16);
	var queenSideMask = kingFileMask - 1;
	var kingSideMask = position.castling[color] & ~(kingFileMask | queenSideMask);
	queenSideMask = position.castling[color] & queenSideMask;
	var fenFlag = '';

	// King-side castling flag
	var rookSquare = -1;
	if (kingSideMask !== 0) {
		for (var sq = kingSquare + 1; sq <= lastSquare; ++sq) {
			if (position.board[sq] === targetRook) {
				if (rookSquare < 0) {
					rookSquare = sq;
				}
				else {
					return false;
				}
			}
		}
		if (rookSquare < 0 || kingSideMask !== 1 << (rookSquare % 16)) {
			return false;
		}
		fenFlag += 'k';
	}

	// Queen-side castling flag
	rookSquare = -1;
	if (queenSideMask !== 0) {
		for (var sq = firstSquare; sq < kingSquare; ++sq) {
			if (position.board[sq] === targetRook) {
				if (rookSquare < 0) {
					rookSquare = sq;
				}
				else {
					return false;
				}
			}
		}
		if (rookSquare < 0 || queenSideMask !== 1 << (rookSquare % 16)) {
			return false;
		}
		fenFlag += 'q';
	}

	return fenFlag === '' ? false : fenFlag;
}


function enPassantToString(position) {
	return position.enPassant < 0 ? '-' : bt.fileToString(position.enPassant) + (position.turn===bt.WHITE ? '6' : '3');
}


exports.parseFEN = function(variant, fen, strict) {

	// Trim the input string and split it into 6 fields.
	fen = fen.replace(/^\s+|\s+$/g, '');
	var fields = fen.split(/\s+/);
	if(fields.length !== 6) {
		throw new exception.InvalidFEN(fen, i18n.WRONG_NUMBER_OF_FEN_FIELDS);
	}

	// The first field (that represents the board) is split in 8 sub-fields.
	var rankFields = fields[0].split('/');
	if(rankFields.length !== 8) {
		throw new exception.InvalidFEN(fen, i18n.WRONG_NUMBER_OF_SUBFIELDS_IN_BOARD_FIELD);
	}

	// Initialize the position
	var position = impl.makeEmpty(variant);
	position.legal = null;

	// Board parsing
	for(var r=7; r>=0; --r) {
		var rankField = rankFields[7-r];
		var i = 0;
		var f = 0;
		while(i<rankField.length && f<8) {
			var s = rankField[i];
			var cp = FEN_PIECE_SYMBOL.indexOf(s);

			// The current character is in the range [1-8] -> skip the corresponding number of squares.
			if(/^[1-8]$/.test(s)) {
				f += parseInt(s, 10);
			}

			// The current character corresponds to a colored piece symbol -> set the current square accordingly.
			else if(cp >= 0) {
				position.board[r*16 + f] = cp;
				++f;
			}

			// Otherwise -> parsing error.
			else {
				throw new exception.InvalidFEN(fen, i18n.UNEXPECTED_CHARACTER_IN_BOARD_FIELD, s);
			}

			// Increment the character counter.
			++i;
		}

		// Ensure that the current sub-field deals with all the squares of the current rank.
		if(i !== rankField.length || f !== 8) {
			throw new exception.InvalidFEN(fen, i18n.UNEXPECTED_END_OF_SUBFIELD_IN_BOARD_FIELD, 8 - r);
		}
	}

	// Turn parsing
	position.turn = bt.colorFromString(fields[1]);
	if(position.turn < 0) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_TURN_FIELD);
	}

	// Castling rights parsing
	position.castling = variant === bt.CHESS960 ? castlingFromStringXFEN(fields[2], strict, position.board) :
		castlingFromStringFEN(fields[2], strict);
	if(position.castling === null) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_CASTLING_FIELD);
	}

	// En-passant rights parsing
	var enPassantField = fields[3];
	if(enPassantField !== '-') {
		if(!/^[a-h][36]$/.test(enPassantField)) {
			throw new exception.InvalidFEN(fen, i18n.INVALID_EN_PASSANT_FIELD);
		}
		if(strict && ((enPassantField[1]==='3' && position.turn===bt.WHITE) || (enPassantField[1]==='6' && position.turn===bt.BLACK))) {
			throw new exception.InvalidFEN(fen, i18n.WRONG_RANK_IN_EN_PASSANT_FIELD);
		}
		position.enPassant = bt.fileFromString(enPassantField[0]);
	}

	// Move counting flags parsing
	var moveCountingRegExp = strict ? /^(?:0|[1-9][0-9]*)$/ : /^[0-9]+$/;
	if(!moveCountingRegExp.test(fields[4])) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_HALF_MOVE_COUNT_FIELD);
	}
	if(!moveCountingRegExp.test(fields[5])) {
		throw new exception.InvalidFEN(fen, i18n.INVALID_MOVE_NUMBER_FIELD);
	}
	return { position: position, fiftyMoveClock: parseInt(fields[4], 10), fullMoveNumber: parseInt(fields[5], 10) };
};


function castlingFromStringFEN(castling, strict) {
	var res = [0, 0];
	if(castling === '-') {
		return res;
	}
	if(!(strict ? /^K?Q?k?q?$/ : /^[KQkq]*$/).test(castling)) {
		return null;
	}
	if(castling.indexOf('K') >= 0) { res[bt.WHITE] |= 1<<7; }
	if(castling.indexOf('Q') >= 0) { res[bt.WHITE] |= 1<<0; }
	if(castling.indexOf('k') >= 0) { res[bt.BLACK] |= 1<<7; }
	if(castling.indexOf('q') >= 0) { res[bt.BLACK] |= 1<<0; }
	return res;
}


function castlingFromStringXFEN(castling, strict, board) {
	var result = [0, 0];
	if(castling === '-') {
		return result;
	}
	if(!(strict ? /^[A-H]{0,2}[a-h]{0,2}$/ : /^[A-Ha-h]*|[KQkq]*$/).test(castling)) {
		return null;
	}

	function searchQueenSideRook(color) {
		var targetRook = bt.ROOK * 2 + color;
		var targetKing = bt.KING * 2 + color;
		for(var sq = 112*color; sq < 112*color + 8; ++sq) {
			if(board[sq] === targetRook) {
				return sq % 8;
			}
			else if(board[sq] === targetKing) {
				break;
			}
		}
		return 0;
	}

	function searchKingSideRook(color) {
		var targetRook = bt.ROOK * 2 + color;
		var targetKing = bt.KING * 2 + color;
		for(var sq = 112*color + 7; sq >= 112*color; --sq) {
			if(board[sq] === targetRook) {
				return sq % 8;
			}
			else if(board[sq] === targetKing) {
				break;
			}
		}
		return 7;
	}

	if(castling.indexOf('K') >= 0) { result[bt.WHITE] |= 1 << searchKingSideRook (bt.WHITE); }
	if(castling.indexOf('Q') >= 0) { result[bt.WHITE] |= 1 << searchQueenSideRook(bt.WHITE); }
	if(castling.indexOf('k') >= 0) { result[bt.BLACK] |= 1 << searchKingSideRook (bt.BLACK); }
	if(castling.indexOf('q') >= 0) { result[bt.BLACK] |= 1 << searchQueenSideRook(bt.BLACK); }

	for(var file = 0; file < 8; ++file) {
		var s = bt.fileToString(file);
		if(castling.indexOf(s.toUpperCase()) >= 0) { result[bt.WHITE] |= 1 << file; }
		if(castling.indexOf(s              ) >= 0) { result[bt.BLACK] |= 1 << file; }
	}
	return result;
}
