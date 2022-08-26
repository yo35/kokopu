/* -------------------------------------------------------------------------- *
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
 * -------------------------------------------------------------------------- */


const process = require('process');
const readline = require('readline');
const { Readable } = require('stream');
const Client = require('ssh2-sftp-client');
const { version } = require('../package.json');

function promptPassword(prompt, callback) {

	let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	rl.input.on("keypress", () => {
		let len = rl.line.length;
		readline.moveCursor(rl.output, -len, 0);
		readline.clearLine(rl.output, 1);
		rl.output.write('*'.repeat(len));
	});

	let password = '';
	rl.on('close', () => callback(password));

	rl.question(prompt, answer => {
		password = answer;
		rl.close();
	});
}


const HOST = 'ftp.cluster007.ovh.net';
const USER = 'yolgiypr';
const ROOT_DIR = 'kokopu';

promptPassword(`Pass for ${USER}@${HOST}: `, pass => {

	// Validate the password.
	if (!pass) {
		console.log('Deploy canceled.');
		return;
	}

	let client = new Client();
	client.connect({
		host: HOST,
		username: USER,
		password: pass,
	}).then(() => {

		// Upload the ZIP archive with the browser-ready scripts.
		console.log(`Upload kokopu-${version}.zip...`);
		return client.put(`dist/kokopu-${version}.zip`, `${ROOT_DIR}/dist/kokopu-${version}.zip`, { mode: 0o644 });

	}).then(() => {

		// Redirect kokopu.zip to the archive corresponding to the latest version.
		console.log(`Redirect /dist/kokopu.zip to /dist/kokopu-${version}.zip...`);
		let htaccess = Readable.from([ `Redirect "/dist/kokopu.zip" "/dist/kokopu-${version}.zip"` ]);
		return client.put(htaccess, `${ROOT_DIR}/dist/.htaccess`, { mode: 0o644 });

	}).then(() => {

		// Upload the documentation.
		console.log('Upload documentation...');
		return client.uploadDir('dist/docs', `${ROOT_DIR}/docs/${version}`);

	}).then(() => {

		// Redirect /docs/current to the directory corresponding to latest documentation version.
		console.log(`Redirect /docs/current to /docs/${version}...`);
		let htaccess = Readable.from([ `Redirect "/docs/current" "/docs/${version}"` ]);
		return client.put(htaccess, `${ROOT_DIR}/docs/.htaccess`, { mode: 0o644 });

	}).then(() => console.log('Done.')).catch(err => { console.error(err); process.exitCode = 1; }).finally(() => client.end());
});
