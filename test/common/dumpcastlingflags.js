/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2023  Yoann Le Montagner <yo35 -at- melix.net>       *
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


module.exports = function(position, getter) {
	let result = '';
	for (const castle of position.variant() === 'chess960' ? 'abcdefgh' : 'kq') {
		if (getter(position, 'w' + castle)) {
			result += castle.toUpperCase();
		}
	}
	for (const castle of position.variant() === 'chess960' ? 'abcdefgh' : 'kq') {
		if (getter(position, 'b' + castle)) {
			result += castle;
		}
	}
	return result === '' ? '-' : result;
};
