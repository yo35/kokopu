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
        './doc_src/migration.md',
        './doc_src/tutorials.md',
    ],
};
