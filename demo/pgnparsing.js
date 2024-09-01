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


const { exception, pgnRead } = require('../dist/lib/index');
const fs = require('fs');
const { program } = require('commander');


function alignLeft(data, width) {
    const result = String(data);
    return result.length < width ? result + ' '.repeat(width - result.length) : result;
}


function alignRight(data, width) {
    const result = String(data);
    return result.length < width ? ' '.repeat(width - result.length) + result : result;
}


function loadDatabase(text, path, errors) {
    try {
        return pgnRead(text);
    }
    catch (error) {
        if (error instanceof exception.InvalidPGN) {
            errors.set(path, error);
            return null;
        }
        else {
            throw error;
        }
    }
}


function loadGames(database, path, errors) {
    try {
        if (database === null) {
            return;
        }

        const gameCount = database.gameCount();
        for (let i = 0; i < gameCount; ++i) {
            database.game(i);
        }
    }
    catch (error) {
        if (error instanceof exception.InvalidPGN) {
            errors.set(path, error);
        }
        else {
            throw error;
        }
    }
}


function displayInvalidPGNError(path, error) {
    console.log(`\nError in file ${path}:\n${error.message}`);
    if (error.index >= error.pgn.length) {
        console.log('Occurred at the end of the string.');
    }
    else {
        const endOfExtract = Math.min(error.index + 40, error.pgn.length);
        const extract = error.pgn.substring(error.index, endOfExtract).replace(/\n|\t|\r/g, ' ');
        console.log(`Occurred at character ${error.index}: ${extract}`);
    }
}


/**
 * Load the text files, parse their content as PGN, and display the time it takes to do that.
 */
function run(paths, pathAlignment) {
    const errors = new Map();
    for (const path of paths) {

        const text = fs.readFileSync(path, 'utf8');

        const startAt = Date.now();
        const database = loadDatabase(text, path, errors);
        const stop1 = Date.now();
        loadGames(database, path, errors);
        const stop2 = Date.now();

        const duration1 = stop1 - startAt;
        const duration2 = stop2 - startAt;

        const sep = '     ';
        console.log(
            'File: ' + alignLeft(path, pathAlignment) + sep +
            'Games: ' + alignRight(database === null ? '--' : database.gameCount(), 7) + sep +
            'Indexing: ' + alignRight(duration1, 6) + ' ms' + sep +
            'Loading: ' + alignRight(duration2, 6) + ' ms');
    }

    for (const [ path, error ] of errors.entries()) {
        displayInvalidPGNError(path, error);
    }
}


// -----------------------------------------------------------------------------
// Command line parsing
// -----------------------------------------------------------------------------

program
    .argument('<pgn-files...>', 'path to the PGN files to analyse')
    .description('Analyze some PGN files')
    .parse(process.argv);

const pathAlignment = program.args.map(path => path.length).reduce((l1, l2) => Math.max(l1, l2));
console.log('Analyzing ' + program.args.length + ' PGN file(s)...');
run(program.args, pathAlignment);
