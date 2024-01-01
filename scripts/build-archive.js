/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2024  Yoann Le Montagner <yo35 -at- melix.net>       *
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


const archiver = require('archiver');
const browserify = require('browserify');
const uglify = require('uglify-js');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { author, license, version } = require('../package.json');

const output = path.resolve(__dirname, `../dist/kokopu-${version}.zip`);
const infoFiles = [ 'README.md', 'CHANGELOG.md', 'LICENSE' ].map(file => path.resolve(__dirname, '../' + file));
const inputLibFile = path.resolve(__dirname, '../dist/lib/index.js');
const browserifiedLibFile = path.resolve(__dirname, '../build/kokopu.js');
const minifiedLibFile = path.resolve(__dirname, '../build/kokopu.min.js');

// Merge all lib files into a single one, exporting the symbol `kokopu`.
async function buildBrowserifiedLib() {
	fs.mkdirSync(path.dirname(browserifiedLibFile), { recursive: true });
	const browserifiedLibStream = fs.createWriteStream(browserifiedLibFile, { encoding: 'utf8' });
	browserifiedLibStream.write(
`/**
 * kokopu (https://www.npmjs.com/package/kokopu)
 * @version ${version}
 * @author ${author}
 * @license ${license}
 */
`);
	browserify(inputLibFile, { standalone: 'kokopu' }).bundle().pipe(browserifiedLibStream);
	return new Promise(resolve => browserifiedLibStream.on('finish', resolve));
}

// Minify the lib file.
async function buildMinifiedLib() {
	fs.mkdirSync(path.dirname(minifiedLibFile), { recursive: true });
	const browserifiedLibData = fs.readFileSync(browserifiedLibFile, { encoding: 'utf8' });
	const minifiedLibData = uglify.minify(browserifiedLibData, { output: { comments: 'some' } });
	if (minifiedLibData.error) {
		throw minifiedLibData.error;
	}
	fs.writeFileSync(minifiedLibFile, minifiedLibData.code, { encoding: 'utf8' });
}

// Create the archive.
async function buildArchive() {
	fs.mkdirSync(path.dirname(output), { recursive: true });
	const archive = archiver('zip');
	archive.pipe(fs.createWriteStream(output));
	for (const infoFile of infoFiles) {
		archive.file(infoFile, { name: path.basename(infoFile) });
	}
	archive.file(browserifiedLibFile, { name: 'kokopu.js' });
	archive.file(minifiedLibFile, { name: 'kokopu.min.js' });
	return archive.finalize();
}


async function run() {
	await buildBrowserifiedLib();
	await buildMinifiedLib();
	await buildArchive();
}

run().catch(err => { console.error(err); process.exitCode = 1; });
