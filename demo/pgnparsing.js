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


var kokopu = require('../src/index');
var fs = require('fs');
var program = require('commander');


function alignLeft(data, width) {
	var result = String(data);
	while(result.length < width) {
		result = result + ' ';
	}
	return result;
}


function alignRight(data, width) {
	var result = String(data);
	while(result.length < width) {
		result = ' ' + result;
	}
	return result;
}


function loadDatabase(text, path, errors) {
	try {
		return kokopu.pgnRead(text);
	}
	catch(error) {
		if(error instanceof kokopu.exception.InvalidPGN) {
			errors[path] = error;
			return null;
		}
		else {
			throw error;
		}
	}
}


function loadGames(database, path, errors) {
	try {
		if(database === null) {
			return;
		}

		var gameCount = database.gameCount();
		for(var i=0; i<gameCount; ++i) {
			database.game(i);
		}
	}
	catch(error) {
		if(error instanceof kokopu.exception.InvalidPGN) {
			errors[path] = error;
		}
		else {
			throw error;
		}
	}
}


function displayInvalidPGNError(path, error) {
	console.log('\nError in file ' + path + ':\n' + error.message);
	if(error.index >= error.pgn.length) {
		console.log('Occurred at the end of the string.');
	}
	else {
		var endOfExtract = Math.min(error.index + 40, error.pgn.length);
		var extract = error.pgn.substring(error.index, endOfExtract).replace(/\n|\t|\r/g, ' ');
		console.log('Occurred at character ' + error.index + ': ' + extract);
	}
}


/**
 * Load the text files, parse their content as PGN, and display the time it takes to do that.
 */
function run(paths, pathAlignment) {
	var errors = {};
	paths.forEach(function(path) {

		var text = fs.readFileSync(path, 'utf8');

		var startAt = Date.now();
		var database = loadDatabase(text, path, errors);
		var stop1 = Date.now();
		loadGames(database, path, errors);
		var stop2 = Date.now();

		var duration1 = stop1 - startAt;
		var duration2 = stop2 - startAt;

		var sep = '     ';
		console.log(
			'File: ' + alignLeft(path, pathAlignment) + sep +
			'Games: ' + alignRight(database === null ? '--' : database.gameCount(), 7) + sep +
			'Indexing: ' + alignRight(duration1, 6) + ' ms' + sep +
			'Loading: ' + alignRight(duration2, 6) + ' ms');
	});

	for(var path in errors) {
		displayInvalidPGNError(path, errors[path]);
	}
}



// -----------------------------------------------------------------------------
// Command line parsing
// -----------------------------------------------------------------------------

program
	.arguments('<pgn-files...>')
	.description('Analyze some PGN files', {
		'pgn-files': 'path to the PGN files to analyse'
	})
	.parse(process.argv);

var pathAlignment = program.args.map(function(path) { return path.length; }).reduce(function(l1, l2) { return Math.max(l1, l2); });
console.log('Analyzing ' + program.args.length + ' PGN file(s)...');
run(program.args, pathAlignment);
