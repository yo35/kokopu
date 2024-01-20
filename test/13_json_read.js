/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2024  Yoann Le Montagner <yo35 -at- melix.net>       *
 *                                                                            *
 *    Kokopu is free software: you can redistribute it and/or                 *
 *    modify it under the terms of the GNU Lesser General Public License      *
 *    as published by the Free Software Foundation, either version 3 of       *
 *    the License, or (at your option) any later version.                     *
 *                                                                            *
 *    Kokopu is distributed in the hope that it will be useful,               *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the            *
 *    GNU Lesser General Public License for more details.                     *
 *                                                                            *
 *    You should have received a copy of the GNU Lesser General               *
 *    Public License along with this program. If not, see                     *
 *    <http://www.gnu.org/licenses/>.                                         *
 *                                                                            *
 * -------------------------------------------------------------------------- */


const { exception, Game } = require('../dist/lib/index');
const dumpGame = require('./common/dumpgame');
const readCSV = require('./common/readcsv');
const readText = require('./common/readtext');
const resourceExists = require('./common/resourceexists');
const test = require('unit.js');


function testData() {
	return readCSV('jsons.csv', fields => {
		const label = fields[0].trim();
		if (label.length === 0 || label.charAt(0) === '#') {
			return false;
		}
		return {
			label: label,
			json: readText(`jsons/${fields[0]}/game.json`),
		};
	});
}


/**
 * Return whether the JSON item corresponding to the given name is expected to be parsed as a valid game,
 * or is expected to throw an exception on a parsing attempt.
 */
function getItemType(jsonName) {
	const fileBasename = `jsons/${jsonName}/game`;
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
 * Load the descriptor corresponding to a valid JSON item.
 */
function loadValidItemDescriptor(jsonName) {
	const filename = `jsons/${jsonName}/game.txt`;
	return readText(filename).trim();
}


/**
 * Load the descriptor corresponding to an invalid JSON item.
 */
function loadErrorItemDescriptor(jsonName) {
	const filename = `jsons/${jsonName}/game.err`;
	const fields = readText(filename).split('\n');
	return { fieldName: fields[0], message: fields[1].trim() };
}


function itCheckJSONItem(label, jsonName, loader) {
	it(label, () => {

		// TXT type => ensure that the item is valid, and compare its dump result to the descriptor.
		if (getItemType(jsonName) === 'txt') {
			const expectedDescriptor = loadValidItemDescriptor(jsonName);
			test.value(dumpGame(loader()).trim()).is(expectedDescriptor);
		}

		// ERR type => ensure that an exception is thrown, and check its attributes.
		else {
			const expectedDescriptor = loadErrorItemDescriptor(jsonName);
			test.exception(() => loader())
				.isInstanceOf(exception.InvalidPOJO)
				.hasProperty('fieldName', expectedDescriptor.fieldName)
				.hasProperty('message', expectedDescriptor.message);
		}
	});
}


describe('Read JSON', () => {
	for (const elem of testData()) {
		itCheckJSONItem(`File ${elem.label}`, elem.label, () => Game.fromPOJO(JSON.parse(elem.json)));
	}
});


describe('Read non-JSONified POJO', () => {

	itCheckJSONItem('Undefined fields', 'undefined-fields', () => Game.fromPOJO({
		event: 'Game with undefined fields',
		site: undefined,
		white: undefined,
		black: {
			elo: undefined,
		},
		mainVariation: [
			'e4',
			{ notation: 'e5', variations: undefined },
			'Nf3',
			'Nc6',
			{ notation: 'd4', comment: 'I\'m a comment...', isLongComment: undefined },
			{ notation: 'exd4', nags: [ 1, undefined, 10 ], tags: { cal: undefined, csl: 'Gd4' } },
		],
	}));

	itCheckJSONItem('Not a POJO', 'not-a-pojo', () => Game.fromPOJO('not-a-pojo'));

});
