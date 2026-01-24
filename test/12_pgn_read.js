/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2026  Yoann Le Montagner <yo35 -at- melix.net>       *
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


const { exception, Database, pgnRead } = require('../dist/lib/index');
const dumpGame = require('./common/dumpgame');
const readCSV = require('./common/readcsv');
const readText = require('./common/readtext');
const resourceExists = require('./common/resourceexists');
const assert = require('node:assert/strict');


function testData() {
    return readCSV('pgns.csv', fields => {
        const label = fields[0].trim();
        if (label.length === 0 || label.charAt(0) === '#') {
            return false;
        }
        return {
            label: label,
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
            assert(database instanceof Database);
            assert.deepEqual(database.gameCount(), elem.gameCount);
        });
    }
});


function itCheckPgnItem(label, pgnName, gameIndex, loader) {
    it(label, () => {

        // TXT type => ensure that the item is valid, and compare its dump result to the descriptor.
        if (getItemType(pgnName, gameIndex) === 'txt') {
            const expectedDescriptor = loadValidItemDescriptor(pgnName, gameIndex);
            assert.deepEqual(dumpGame(loader(gameIndex)).trim(), expectedDescriptor);
        }

        // ERR type => ensure that an exception is thrown, and check its attributes.
        else {
            const expectedDescriptor = loadErrorItemDescriptor(pgnName, gameIndex);
            assert.throws(() => loader(gameIndex), e => {
                assert(e instanceof exception.InvalidPGN);
                assert.deepEqual(e.index, expectedDescriptor.index);
                assert.deepEqual(e.lineNumber, expectedDescriptor.lineNumber);
                assert.deepEqual(e.message, expectedDescriptor.message);
                return true;
            });
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

    function itInvalidGameIndex(label, pgnName, gameCount, gameIndex, invalidPGNExpected) {

        it('Database - ' + label, () => {
            const pgn = readText(`pgns/${pgnName}/database.pgn`);
            const database = pgnRead(pgn);
            if (invalidPGNExpected) {
                assert.throws(() => database.game(gameIndex), e => {
                    assert(e instanceof exception.InvalidPGN);
                    assert.deepEqual(e.pgn, pgn);
                    assert.deepEqual(e.message, `Game index ${gameIndex} is invalid (only ${gameCount} game(s) found in the PGN data).`);
                    return true;
                });
            }
            else {
                assert.throws(() => database.game(gameIndex), exception.IllegalArgument);
            }
        });

        it('Direct access - ' + label, () => {
            const pgn = readText(`pgns/${pgnName}/database.pgn`);
            if (invalidPGNExpected) {
                assert.throws(() => pgnRead(pgn, gameIndex), e => {
                    assert(e instanceof exception.InvalidPGN);
                    assert.deepEqual(e.pgn, pgn);
                    assert.deepEqual(e.message, `Game index ${gameIndex} is invalid (only ${gameCount} game(s) found in the PGN data).`);
                    return true;
                });
            }
            else {
                assert.throws(() => pgnRead(pgn, gameIndex), exception.IllegalArgument);
            }
        });
    }

    itInvalidGameIndex('Negative index', 'mini2', 2, -2, false);
    itInvalidGameIndex('Non integer index', 'mini2', 2, 0.3, false);
    itInvalidGameIndex('Too large index (regular file)', 'mini2', 2, 99, true);
    itInvalidGameIndex('Too large index (empty file)', 'empty', 0, 99, true);
    itInvalidGameIndex('Too large index (without last end-of-game)', 'missing-last-end-of-game', 2, 99, true);
    itInvalidGameIndex('Just after the last game (regular file)', 'mini2', 2, 2, true);
    itInvalidGameIndex('Just after the last game (empty file)', 'empty', 0, 0, true);
    itInvalidGameIndex('Just after the last game (without last end-of-game)', 'missing-last-end-of-game', 2, 2, true);
    itInvalidGameIndex('NaN index', 'mini2', 2, NaN, false);
    itInvalidGameIndex('Non number index', 'mini2', 2, 'xyz', false);
});


describe('Read PGN - Database iterator', () => {

    function itCheckIterator(pgnName, pgnText, expectedGameCount) {
        it(`File ${pgnName}`, () => {

            const database = pgnRead(pgnText);
            let gameIndex = 0;
            for (const game of database.games()) {

                // Find the index of the next parsable item.
                while (getItemType(pgnName, gameIndex) !== 'txt') {
                    gameIndex++;
                }

                const expectedDescriptor = loadValidItemDescriptor(pgnName, gameIndex++);
                assert.deepEqual(dumpGame(game).trim(), expectedDescriptor);
            }

            // Skip the remaining unparsable items.
            while (gameIndex < expectedGameCount && getItemType(pgnName, gameIndex) !== 'txt') {
                gameIndex++;
            }

            assert.deepEqual(gameIndex, expectedGameCount);
        });
    }

    for (const elem of testData()) {
        itCheckIterator(elem.label, elem.pgn, elem.gameCount);
    }
});
