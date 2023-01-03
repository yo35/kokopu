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


const { exception, Database, pgnRead } = require('../dist/lib/index');
const dumpGame = require('./common/dumpgame');
const readCSV = require('./common/readcsv');
const readText = require('./common/readtext');
const resourceExists = require('./common/resourceexists');
const test = require('unit.js');


function testData() {
	return readCSV('pgns.csv', fields => {
		return {
			label: fields[0],
			gameCount: parseInt(fields[1]),
			pgn: readText(`pgns/${fields[0]}/database.pgn`),
		};
	});
}


/**
 * Return whether the PGN item corresponding to the given index in the PGN file corresponding to the given name is expected to be parsed
 * as a valid PGN item, or is expected to throw an exception on a parsing attempt.
 */
function getItemType(pgnName, gameIndex) {
	const fileBasename = `pgns/${pgnName}/${gameIndex}`;
	const txtExist = resourceExists(fileBasename + '.txt');
	const errExist = resourceExists(fileBasename + '.err');
	if (txtExist && errExist) {
		throw 'Both .txt not .err defined for ' + fileBasename; // eslint-disable-line no-throw-literal
	}
	else if (txtExist) {
		return 'txt';
	}
	else if (errExist) {
		return 'err';
	}
	else {
		throw 'Neither .txt nor .err defined for ' + fileBasename; // eslint-disable-line no-throw-literal
	}
}


/**
 * Load the descriptor corresponding to a valid PGN item.
 */
function loadValidItemDescriptor(pgnName, gameIndex) {
	const filename = `pgns/${pgnName}/${gameIndex}.txt`;
	return readText(filename).trim();
}


/**
 * Load the descriptor corresponding to an invalid PGN item.
 */
function loadErrorItemDescriptor(pgnName, gameIndex) {
	const filename = `pgns/${pgnName}/${gameIndex}.err`;
	const fields = readText(filename).split('\n');
	return { index: parseInt(fields[0]), lineNumber: parseInt(fields[1]), message: fields[2].trim() };
}


describe('Read PGN - Game count', () => {
	for (const elem of testData()) {
		it('File ' + elem.label, () => {
			const database = pgnRead(elem.pgn);
			test.value(database).isInstanceOf(Database);
			test.value(database.gameCount()).is(elem.gameCount);
		});
	}
});


function itCheckPgnItem(label, pgnName, gameIndex, loader) {
	it(label, () => {

		// TXT type => ensure that the item is valid, and compare its dump result to the descriptor.
		if (getItemType(pgnName, gameIndex) === 'txt') {
			const expectedDescriptor = loadValidItemDescriptor(pgnName, gameIndex);
			test.value(dumpGame(loader(gameIndex)).trim()).is(expectedDescriptor);
		}

		// ERR type => ensure that an exception is thrown, and check its attributes.
		else {
			const expectedDescriptor = loadErrorItemDescriptor(pgnName, gameIndex);
			test.exception(() => loader(gameIndex))
				.isInstanceOf(exception.InvalidPGN)
				.hasProperty('index', expectedDescriptor.index)
				.hasProperty('lineNumber', expectedDescriptor.lineNumber)
				.hasProperty('message', expectedDescriptor.message);
		}
	});
}


describe('Read PGN - Game content (direct access)', () => {
	for (const elem of testData()) {
		for (let gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			itCheckPgnItem(`File ${elem.label} - Game ${gameIndex}`, elem.label, gameIndex, i => pgnRead(elem.pgn, i));
		}
	}
});


/**
 * Wrapper that implements lazy-instantiation of a database.
 */
class DatabaseHolder {

	constructor(pgn) {
		this._pgn = pgn;
	}

	database() {
		if (this._database === undefined) {
			this._database = pgnRead(this._pgn);
		}
		return this._database;
	}
}


describe('Read PGN - Game content (database)', () => {
	for (const elem of testData()) {
		const holder = new DatabaseHolder(elem.pgn);
		for (let gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			if (gameIndex % 3 === 2) {
				continue;
			}
			itCheckPgnItem(`File ${elem.label} - Game ${gameIndex}`, elem.label, gameIndex, i => holder.database().game(i));
		}
		for (let gameIndex = 0; gameIndex < elem.gameCount; ++gameIndex) {
			if (gameIndex % 3 !== 2) {
				continue;
			}
			itCheckPgnItem(`File ${elem.label} - Game ${gameIndex}`, elem.label, gameIndex, i => holder.database().game(i));
		}
	}
});


describe('Read PGN - Wrong game index', () => {

	function itInvalidGameIndex(label, gameIndex, invalidPGNExpected) {

		it('Database - ' + label, () => {
			const pgn = readText('pgns/mini2/database.pgn');
			const database = pgnRead(pgn);
			if (invalidPGNExpected) {
				test.exception(() => database.game(gameIndex))
					.isInstanceOf(exception.InvalidPGN)
					.hasProperty('pgn', pgn)
					.hasProperty('message', `Game index ${gameIndex} is invalid (only 2 game(s) found in the PGN data).`);
			}
			else {
				test.exception(() => database.game(gameIndex)).isInstanceOf(exception.IllegalArgument);
			}
		});

		it('Direct access - ' + label, () => {
			const pgn = readText('pgns/mini2/database.pgn');
			if (invalidPGNExpected) {
				test.exception(() => pgnRead(pgn, gameIndex))
					.isInstanceOf(exception.InvalidPGN)
					.hasProperty('pgn', pgn)
					.hasProperty('message', `Game index ${gameIndex} is invalid (only 2 game(s) found in the PGN data).`);
			}
			else {
				test.exception(() => pgnRead(pgn, gameIndex)).isInstanceOf(exception.IllegalArgument);
			}
		});
	}

	itInvalidGameIndex('Negative index', -2, false);
	itInvalidGameIndex('Non integer index', 0.3, false);
	itInvalidGameIndex('Too large index', 99, true);
	itInvalidGameIndex('NaN index', NaN, false);
	itInvalidGameIndex('Non number index', 'xyz', false);
});
