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


const { Position } = require('../dist/lib/index');
const { program } = require('commander');


function align(data, width) {
    const result = String(data);
    return result.length < width ? ' '.repeat(width - result.length) + result : result;
}


/**
 * Generate recursively the successors of the given position, up to the given depth.
 */
function generateSuccessors(pos, depth) {
    let result = 1;
    if (depth > 0) {
        for (const move of pos.moves()) {
            const nextPos = new Position(pos);
            nextPos.play(move);
            result += generateSuccessors(nextPos, depth - 1);
        }
    }
    return result;
}


/**
 * Measure the performance of the move generation procedure, starting from the given position,
 * and up to the given depth.
 */
function run(fen, minDepth, maxDepth, verbose) {

    const initialPos = new Position(fen);
    function runAtDepth(depth) {

        const startAt = Date.now();
        const nodes = generateSuccessors(initialPos, depth);
        const stopAt = Date.now();

        const duration = stopAt - startAt;
        const speed = nodes / duration;
        const sep = '     ';
        console.log(
            'Depth: ' + align(depth, 2) + sep +
            'Nodes: ' + align(nodes, 10) + sep +
            'Duration: ' + align(duration, 8) + ' ms' + sep +
            'Speed: ' + align(Number.isFinite(speed) ? speed.toFixed(1) : '--', 7) + ' kN/s');
    }

    console.log('Initial position is: ' + initialPos.fen());
    if (verbose) {
        console.log(initialPos.ascii());
    }
    console.log('Starting generation up to depth ' + maxDepth);

    for (let depth = minDepth; depth <= maxDepth; ++depth) {
        runAtDepth(depth);
    }
}



// -----------------------------------------------------------------------------
// Command line parsing
// -----------------------------------------------------------------------------

program
    .description('Recursive generation of chess moves, starting from a given position')
    .option('-P, --position <fen>', 'initial position', 'start')
    .option('-D, --depth <depth>', 'maximum depth to visit', 5)
    .option('-v, --verbose', 'increase the verbosity level')
    .parse(process.argv);

const opts = program.opts();
run(opts.position, 0, parseInt(opts.depth), Boolean(opts.verbose));
