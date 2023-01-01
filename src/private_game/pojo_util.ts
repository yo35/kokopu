/* -------------------------------------------------------------------------- *
 *                                                                            *
 *    This file is part of Kokopu, a JavaScript chess library.                *
 *    Copyright (C) 2018-2023  Yoann Le Montagner <yo35 -at- melix.net>       *
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


import { InvalidPOJO } from '../exception';
import { i18n } from '../i18n';


/**
 * Helper class to build a {@link InvalidPOJO}.
 */
export class POJOExceptionBuilder {

	#pojo: unknown;
	#path: (string | number)[] = [];

	constructor(pojo: unknown) {
		this.#pojo = pojo;
	}

	push(fieldName: string | number) {
		this.#path.push(fieldName);
	}

	pop() {
		this.#path.pop();
	}

	build(message: string, ...tokens: any[]) {
		let fieldName = '';
		let isFirstPathComponent = true;
		for (const pathComponent in this.#path) {
			if (typeof pathComponent === 'number') {
				fieldName += `[${pathComponent}]`;
			}
			else {
				fieldName += isFirstPathComponent ? pathComponent : '.' + pathComponent;
			}
			isFirstPathComponent = false;
		}
		return new InvalidPOJO(this.#pojo, fieldName, message, tokens);
	}
}


/**
 * Validate a string-valued field read from a POJO.
 */
export function decodeStringField(pojo: Partial<Record<string, unknown>>, fieldName: string, exceptionBuilder: POJOExceptionBuilder, setter: (value: string) => void) {
	if (!(fieldName in pojo)) {
		return;
	}
	exceptionBuilder.push(fieldName);
	const value = pojo[fieldName];
	if (typeof value === 'string') {
		setter(value);
	}
	else if (value !== undefined) {
		throw exceptionBuilder.build(i18n.INVALID_POJO_STRING_FIELD);
	}
	exceptionBuilder.pop();
}


/**
 * Validate a number-valued field read from a POJO.
 */
export function decodeNumberField(pojo: Partial<Record<string, unknown>>, fieldName: string, exceptionBuilder: POJOExceptionBuilder, setter: (value: number) => void) {
	if (!(fieldName in pojo)) {
		return;
	}
	exceptionBuilder.push(fieldName);
	const value = pojo[fieldName];
	if (typeof value === 'number') {
		setter(value);
	}
	else if (value !== undefined) {
		throw exceptionBuilder.build(i18n.INVALID_POJO_NUMBER_FIELD);
	}
	exceptionBuilder.pop();
}


/**
 * Validate a boolean-valued field read from a POJO.
 */
export function decodeBooleanField(pojo: Partial<Record<string, unknown>>, fieldName: string, exceptionBuilder: POJOExceptionBuilder, setter: (value: boolean) => void) {
	if (!(fieldName in pojo)) {
		return;
	}
	exceptionBuilder.push(fieldName);
	const value = pojo[fieldName];
	if (typeof value === 'boolean') {
		setter(value);
	}
	else if (value !== undefined) {
		throw exceptionBuilder.build(i18n.INVALID_POJO_BOOLEAN_FIELD);
	}
	exceptionBuilder.pop();
}


/**
 * Validate an array-valued field read from a POJO.
 */
export function decodeArrayField(pojo: Partial<Record<string, unknown>>, fieldName: string, exceptionBuilder: POJOExceptionBuilder, setter: (value: unknown[]) => void) {
	if (!(fieldName in pojo)) {
		return;
	}
	exceptionBuilder.push(fieldName);
	const value = pojo[fieldName];
	if (Array.isArray(value)) {
		setter(value);
	}
	else if (value !== undefined) {
		throw exceptionBuilder.build(i18n.INVALID_POJO_ARRAY_FIELD);
	}
	exceptionBuilder.pop();
}


/**
 * Validate an object-valued field read from a POJO.
 */
export function decodeObjectField(pojo: Partial<Record<string, unknown>>, fieldName: string, exceptionBuilder: POJOExceptionBuilder, setter: (value: Partial<Record<string, unknown>>) => void) {
	if (!(fieldName in pojo)) {
		return;
	}
	exceptionBuilder.push(fieldName);
	const value = pojo[fieldName];
	if (typeof value === 'object' && value !== null) {
		setter(value);
	}
	else if (value !== undefined) {
		throw exceptionBuilder.build(i18n.INVALID_POJO_OBJECT_FIELD);
	}
	exceptionBuilder.pop();
}
