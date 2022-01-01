/******************************************************************************
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
 ******************************************************************************/


'use strict';


var prompt = require('prompt');
var Readable = require('stream').Readable;
var Client = require('ssh2-sftp-client');
var version = require('../package.json').version;

prompt.start();
prompt.get({ name: 'password', hidden: true, replace: '*' }, function(err, result) {

	// Validate the password.
	if (err) {
		console.log(err);
		return;
	}
	else if (result.password === '') {
		console.log('Deploy canceled.');
		return;
	}

	var client = new Client();
	client.connect({
		host: 'ftp.cluster007.ovh.net',
		username: 'yolgiypr',
		password: result.password
	}).then(function() {

		// Upload the ZIP archive with the browser-ready scripts.
		console.log('Upload kokopu-' + version + '.zip...');
		return client.put('dist/kokopu-' + version + '.zip', 'kokopu/dist/kokopu-' + version + '.zip', { mode: 0o644 });

	}).then(function() {

		// Redirect `kokopu.zip` to the archive corresponding to the latest version.
		console.log('Redirect kokopu.zip to kokopu-' + version + '.zip...');
		var htaccess = Readable.from([ 'Redirect "/dist/kokopu.zip" "/dist/kokopu-' + version + '.zip"' ]);
		return client.put(htaccess, 'kokopu/dist/.htaccess', { mode: 0o644 });

	}).then(function() {

		// Upload the documentation.
		console.log('Upload documentation...');
		return client.uploadDir('dist/docs', 'kokopu/docs');

	}).then(function() {
		console.log('Done.');
	}).catch(function(err) {
		console.log(err);
	}).finally(function() {
		return client.end();
	});
});
