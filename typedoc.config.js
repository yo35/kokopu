/*!
 * -------------------------------------------------------------------------- *
 *                                                                            *
 *    Kokopu - A JavaScript/TypeScript chess library.                         *
 *    <https://www.npmjs.com/package/kokopu>                                  *
 *    Copyright (C) 2018-2025  Yoann Le Montagner <yo35 -at- melix.net>       *
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
const path = require('path');


const tmpDir = './build/tmp_docs';
fs.mkdirSync(path.resolve(__dirname, tmpDir), { recursive: true });


// Generate the changelog page.
const changelog = fs.readFileSync(path.resolve(__dirname, './CHANGELOG.md'), { encoding: 'utf8' }).split('\n').splice(2);
changelog.unshift('---', 'title: ChangeLog', '---', '', '# ChangeLog', '', '<div id="changelog">');
changelog.push('</div>');
fs.writeFileSync(path.resolve(__dirname, `${tmpDir}/changelog.md`), changelog.join('\n'));


// TypeDoc config.
module.exports = {
    entryPoints: [ './src/index.ts' ],
    out: './dist/docs',
    readme: './doc_src/home.md',
    favicon: './doc_src/kokopu-favicon.png',
    customCss: './doc_src/style.css',
    excludePrivate: true,
    includeVersion: true,
    disableSources: true,
    footerDate: true,
    name: 'Kokopu',
    plugin: [ 'typedoc-plugin-extras' ],
    customTitle: 'Kokopu documentation',
    alwaysCreateEntryPointModule: false,
    projectDocuments: [
        `${tmpDir}/changelog.md`,
        './doc_src/migration.md',
        './doc_src/tutorials.md',
    ],
};
