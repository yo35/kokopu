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


const fs = require('fs');
const process = require('process');
const readline = require('readline');
const { Readable } = require('stream');
const Client = require('ssh2-sftp-client');
const { version } = require('../package.json');


function promptPassword(prompt, callback) {

	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	rl.input.on("keypress", () => {
		const len = rl.line.length;
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


function runUpload(host, user, uploadFun) {
	promptPassword(`Pass for ${user}@${host}: `, async (pass) => {

		// Validate the password.
		if (!pass) {
			console.log('Deploy canceled.');
			return;
		}

		try {
			const client = new Client();
			try {

				// To invoke to upload a file.
				async function uploadText(text, distPath) {
					console.log(`Uploading text to ${distPath}`);
					await client.put(Readable.from([ text ]), distPath, {
						writeStreamOptions: {
							mode: 0o644,
						},
					});
				}

				// To invoke to upload a file or (recursively) a directory.
				async function uploadFile(input, distPath) {
					if (fs.statSync(input).isDirectory()) {
						console.log(`Creating directory ${distPath}`);
						await client.mkdir(distPath);
						await client.chmod(distPath, 0o755);
						for (const file of fs.readdirSync(input)) {
							await uploadFile(`${input}/${file}`, `${distPath}/${file}`);
						}
					}
					else {
						console.log(`Uploading file ${distPath}`);
						await client.put(input, distPath, {
							writeStreamOptions: {
								mode: 0o644,
							},
						});
					}
				}

				// Connect to the server, and execute the upload function.
				await client.connect({
					host: host,
					username: user,
					password: pass,
				});
				await uploadFun(uploadText, uploadFile);
			}
			finally {
				await client.end();
			}
		}
		catch (e) {
			console.error(e);
			process.exitCode = 1;
		}
	});
}


const HOST = 'ftp.cluster007.ovh.net';
const USER = 'yolgiypr';
const ROOT_DIR = 'kokopu';


runUpload(HOST, USER, async (uploadText, uploadFile) => {

	console.log(`*** Standalone library kokopu-${version}.zip ***`);
	await uploadFile(`dist/kokopu-${version}.zip`, `${ROOT_DIR}/dist/kokopu-${version}.zip`);

	console.log(`*** Redirect /dist/kokopu.zip to /dist/kokopu-${version}.zip ***`);
	await uploadText(`Redirect "/dist/kokopu.zip" "/dist/kokopu-${version}.zip"`, `${ROOT_DIR}/dist/.htaccess`);

	console.log('*** Documentation ***');
	await uploadFile('dist/docs', `${ROOT_DIR}/docs/${version}`);

	console.log(`*** Redirect /docs/current to /docs/${version} ***`);
	await uploadText(`Redirect "/docs/current" "/docs/${version}"`, `${ROOT_DIR}/docs/.htaccess`);
});
