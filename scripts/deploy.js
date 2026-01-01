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


const fs = require('fs');
const process = require('process');
const { Readable } = require('stream');
const Client = require('ssh2-sftp-client');
const { version } = require('../package.json');


async function runUpload(uploadFun) {
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
                host: process.env.DEPLOY_HOST,
                port: process.env.DEPLOY_PORT,
                username: process.env.DEPLOY_USER,
                password: process.env.DEPLOY_PASS,
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
}


runUpload(async (uploadText, uploadFile) => {

    console.log('*** Single-file package kokopu.zip ***');
    await uploadFile(`dist/kokopu-${version}.zip`, `dist/kokopu-${version}.zip`);

    console.log(`*** Redirect /dist/kokopu.zip to /dist/kokopu-${version}.zip ***`);
    await uploadText(`Redirect "/dist/kokopu.zip" "/dist/kokopu-${version}.zip"`, 'dist/.htaccess');

    console.log('*** Documentation ***');
    await uploadFile('dist/docs', `docs/${version}`);

    console.log(`*** Redirect /docs/current to /docs/${version} ***`);
    await uploadText(`Redirect "/docs/current" "/docs/${version}"`, 'docs/.htaccess');
});
