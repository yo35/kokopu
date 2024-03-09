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
const readCSV = require('./common/readcsv');
const test = require('unit.js');


const NODE_COUNT_MAX_MAX = 10000000; // -1 for "no limit"
const SPEED_MIN = 100; // kN/s
const FIXED_TIMOUT = 100; // ms


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


function testData() {
    return readCSV('performance.csv', fields => {
        return {
            fen: fields[0],
            nodes: fields.slice(1),
        };
    });
}


describe('Recursive move generation', () => {
    for (const elem of testData()) {
        const initialPos = new Position(elem.fen);
        for (let depth = 0; depth < elem.nodes.length; ++depth) {
            const expectedNodeCount = elem.nodes[depth];
            if (NODE_COUNT_MAX_MAX >= 0 && expectedNodeCount <= NODE_COUNT_MAX_MAX) {
                it(`From ${elem.fen} up to depth ${depth}`, () => {
                    test.value(generateSuccessors(initialPos, depth), expectedNodeCount);
                }).timeout(FIXED_TIMOUT + expectedNodeCount / SPEED_MIN);
            }
        }
    }
});
