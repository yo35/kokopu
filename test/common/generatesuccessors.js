/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2017  Yoann Le Montagner <yo35 -at- melix.net>            *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


'use strict';


var kokopu = require('../../src/core.js');


/**
 * Generate recursively the successors of the given position, up to the given depth.
 */
var generateSuccessors = module.exports = function(pos, depth) {
	var result = 1;

	if(depth > 0) {
		pos.moves().forEach(function(move) {
			var nextPos = new kokopu.Position(pos);
			nextPos.play(move);
			result += generateSuccessors(nextPos, depth-1);
		});
	}

	return result;
};
