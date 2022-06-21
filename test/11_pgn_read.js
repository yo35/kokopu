/******************************************************************************
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
 ******************************************************************************/


'use strict';


var kokopu = require('../src/index');
var readCSV = require('./common/readcsv');
var readText = require('./common/readtext');
var resourceExists = require('./common/resourceexists');
var dumpGame = require('./common/dumpgame');
var test = require('unit.js');


function testData() {
	return readCSV('pgns.csv', function(fields) {
		return {
			label: fields[0],
			gameCount: parseInt(fields[1]),
			pgn: readText('pgns/' + fields[0] + '.pgn')
		};
	});
}


/**
 * Return whether the PGN item corresponding to the given index in the PGN file corresponding to the given name is expected to be parsed
 * as a valid PGN item, or is expected to throw an exception on a parsing attempt.
 *
 * @param {string} pgnName Name of the PGN file (without the .pgn extension)
 * @param {number} gameIndex Index of the item within the PGN file.
 * @returns {string} `'log'` if the PGN item is valid, `'err'` if an exception is expected to be thrown on parsing.
 */
function getItemType(pgnName, gameIndex) {
	var fileBasename = 'pgns/' + pgnName + '/' + gameIndex;
	var logExist = resourceExists(fileBasename + '.log');
	var errExist = resourceExists(fileBasename + '.err');
	if(logExist && errExist) {
		throw 'Both .log not .err defined for ' + fileBasename; // eslint-disable-line no-throw-literal
	}
	else if(logExist) {
		return 'log';
	}
	else if(errExist) {
		return 'err';
	}
	else {
		throw 'Neither .log not .err defined for ' + fileBasename; // eslint-disable-line no-throw-literal
	}
}


/**
 * Load the descriptor corresponding to a valid PGN item.
 *
 * @param {string} pgnName Name of the PGN file (without the .pgn extension)
 * @param {number} gameIndex Index of the item within the PGN file.
 * @returns {string}
 */
function loadValidItemDescriptor(pgnName, gameIndex) {
	var filename = 'pgns/' + pgnName + '/' + gameIndex + '.log';
	return readText(filename).trim();
}


/**
 * Load the descriptor corresponding to an invalid PGN item.
 *
 * @param {string} pgnName Name of the PGN file (without the .pgn extension)
 * @param {number} gameIndex Index of the item within the PGN file.
 * @returns {{index:number, lineNumber:number, message:string}}
 */
function loadErrorItemDescriptor(pgnName, gameIndex) {
	var filename = 'pgns/' + pgnName + '/' + gameIndex + '.err';
	var fields = readText(filename).split('\n');
	return { index: parseInt(fields[0]), lineNumber: parseInt(fields[1]), message: fields[2].trim() };
}


describe('Read PGN - Game count', function() {
	testData().forEach(function(elem) {
		it('File ' + elem.label, function() {
			test.value(kokopu.pgnRead(elem.pgn).gameCount()).is(elem.gameCount);
		});
	});
});


function pgnItemChecker(pgnName, gameIndex, loader) {
	return function() {

		// LOG type => ensure that the item is valid, and compare its dump result to the descriptor.
		if(getItemType(pgnName, gameIndex) === 'log') {
			var expectedDescriptor = loadValidItemDescriptor(pgnName, gameIndex);
			test.value(dumpGame(loader(gameIndex)).trim()).is(expectedDescriptor);
		}

		// ERR type => ensure that an exception is thrown, and check its attributes.
		else {
			var expectedDescriptor = loadErrorItemDescriptor(pgnName, gameIndex);
			test.exception(function() { loader(gameIndex); })
				.isInstanceOf(kokopu.exception.InvalidPGN)
				.hasProperty('index', expectedDescriptor.index)
				.hasProperty('lineNumber', expectedDescriptor.lineNumber)
				.hasProperty('message', expectedDescriptor.message);
		}
	};
}


describe('Read PGN - Game content (direct access)', function() {
	testData().forEach(function(elem) {
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			it('File ' + elem.label + ' - Game ' + gameIndex, pgnItemChecker(elem.label, gameIndex, function(i) {
				return kokopu.pgnRead(elem.pgn, i);
			}));
		}
	});
});


function DatabaseHolder(pgn) {
	this._pgn = pgn;
}


DatabaseHolder.prototype.database = function() {
	if(!(this._database)) {
		this._database = kokopu.pgnRead(this._pgn);
	}
	return this._database;
};


describe('Read PGN - Game content (database)', function() {
	testData().forEach(function(elem) {
		var holder = new DatabaseHolder(elem.pgn);
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			if(gameIndex % 3 === 2) { continue; }
			it('File ' + elem.label + ' - Game ' + gameIndex, pgnItemChecker(elem.label, gameIndex, function(i) {
				return holder.database().game(i);
			}));
		}
		for(var gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			if(gameIndex % 3 !== 2) { continue; }
			it('File ' + elem.label + ' - Game ' + gameIndex, pgnItemChecker(elem.label, gameIndex, function(i) {
				return holder.database().game(i);
			}));
		}
	});
});


describe('Read PGN - Wrong game index', function() {
	[
		{ label: 'Negative index', value: -2 },
		{ label: 'Non integer index', value: 0.3 },
		{ label: 'Too large index', value: 99 },
		{ label: 'NaN index', value: NaN },
		{ label: 'Non number index', value: 'xyz' },
	].forEach(function(elem) {

		it('Database - ' + elem.label, function() {
			var pgn = readText('pgns/mini2.pgn');
			var database = kokopu.pgnRead(pgn);
			test.exception(function() { database.game(elem.value); })
				.isInstanceOf(kokopu.exception.InvalidPGN)
				.hasProperty('pgn', pgn)
				.hasProperty('message', 'Game index ' + elem.value + ' is invalid (only 2 game(s) found in the PGN data).');
		});

		it('Direct access - ' + elem.label, function() {
			var pgn = readText('pgns/mini2.pgn');
			test.exception(function() { kokopu.pgnRead(pgn, elem.value); })
				.isInstanceOf(kokopu.exception.InvalidPGN)
				.hasProperty('pgn', pgn)
				.hasProperty('message', 'Game index ' + elem.value + ' is invalid (only 2 game(s) found in the PGN data).');
		});
	});
});
