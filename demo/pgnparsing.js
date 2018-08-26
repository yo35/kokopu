/******************************************************************************
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018  Yoann Le Montagner <yo35 -at- melix.net>            *
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


var kokopu = require('../index');
var fs = require('fs');
var program = require('commander');


function align(data, width) {
	var result = String(data);
	while(result.length < width) {
		result = ' ' + result;
	}
	return result;
}


function pgnReadSafely(text) {
	try {
		return kokopu.pgnRead(text);
	}
	catch(error) {
		if(error instanceof kokopu.exception.InvalidPGN) {
			return null;
		}
		else {
			throw error;
		}
	}
}


/**
 * Load a text file, parse its content as PGN, and display the time it takes to do that.
 */
function run(path) {

	var step0At = Date.now();
	var text = fs.readFileSync(path, 'utf8');
	var step1At = Date.now();
	var games = pgnReadSafely(text);
	var step2At = Date.now();

	var duration = step2At - step0At;
	var durationParsing = step2At - step1At;

	var sep = '     ';
	console.log(
		'File: ' + align(path, 2) + sep +
		'Games: ' + align(games === null ? '--' : games.length, 7) + sep +
		'Duration: ' + align(duration, 8) + ' ms' + sep +
		'Duration parsing: ' + align(durationParsing, 8) + ' ms');
}



// -----------------------------------------------------------------------------
// Command line parsing
// -----------------------------------------------------------------------------

program
	.parse(process.argv);

if(program.args.length === 0) {
	console.log('No PGN file to analyze.');
}
else {
	run(program.args[0]);
}
