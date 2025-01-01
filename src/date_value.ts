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


import { IllegalArgument } from './exception';


/**
 * Date of a chess game. It can be either partially defined (with the year only, or with the year and month but without day of month),
 * or fully defined (with year, month and day of month).
 *
 * @see {@link Game.date}
 */
export class DateValue {

    #type: 'y' | 'ym' | 'ymd';
    #year: number;
    #month?: number;
    #day?: number;


    /**
     * @param month - If provided, must be between 1 (January) and 12 (December) inclusive.
     * @param day - If provided, must be between 1 and the number of days in the corresponding month (thus 31 at most).
     */
    constructor(year: number, month?: number, day?: number);

    /**
     * Construct a {@link DateValue} object from a standard JavaScript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
     * object.
     *
     * With this constructor, the type of the returned object is always `'ymd'` (see {@link DateValue.type}).
     */
    constructor(date: Date);

    constructor(dateOrYear: Date | number, month?: number, day?: number) {
        if (dateOrYear instanceof Date) {
            this.#type = 'ymd';
            this.#year = dateOrYear.getFullYear();
            this.#month = dateOrYear.getMonth() + 1;
            this.#day = dateOrYear.getDate();
        }
        else {
            const type = computeType(dateOrYear, month, day);
            if (!type) {
                throw new IllegalArgument('DateValue()');
            }
            this.#type = type;
            this.#year = dateOrYear;
            this.#month = month ?? undefined;
            this.#day = day ?? undefined;
        }
    }


    /**
     * Type of date value:
     * - `'y'` means that only the year is defined,
     * - `'ym'` means that the year and the month are defined, but not the day in month,
     * - `'ymd'` means that the exact day is defined.
     */
    type(): 'y' | 'ym' | 'ymd' {
        return this.#type;
    }


    /**
     * Year (e.g. `2022`).
     */
    year(): number {
        return this.#year;
    }


    /**
     * Month index, valued between 1 (January) and 12 (December) inclusive.
     *
     * @throws {@link exception.IllegalArgument} if the current type is `'y'` (see {@link DateValue.type}).
     */
    month(): number {
        if (this.#month === undefined) {
            throw new IllegalArgument('DateValue.month()');
        }
        return this.#month;
    }


    /**
     * Day in month, valued between 1 and the number of days in the corresponding month (thus 31 at most).
     *
     * @throws {@link exception.IllegalArgument} if the current type is `'y'` or `'ym'` (see {@link DateValue.type}).
     */
    day(): number {
        if (this.#day === undefined) {
            throw new IllegalArgument('DateValue.day()');
        }
        return this.#day;
    }


    /**
     * Convert the current object into a standard JavaScript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
     * object.
     *
     * If the type of the current object is `'ym'`, the returned `Date` object points at the first day of the corresponding month.
     * If the type of the current object is `'y'`, the returned `Date` object points at the first day of the corresponding year.
     */
    toDate(): Date {
        const month = this.#month === undefined ? 0 : this.#month - 1;
        const day = this.#day === undefined ? 1 : this.#day;
        return new Date(this.#year, month, day);
    }


    /**
     * Get the date in a compact format (e.g. `'2022-07-19'`, `'2022-07-**'` or `'2022-**-**'` depending on the type of the current object).
     */
    toString(): string {
        return toStringImpl(this.#year, this.#month, this.#day, '-', '**');
    }


    /**
     * Parse the given value as a date in compact format (e.g. `'2022-07-19'`, `'2022-07-**'` or `'2022-**-**'`).
     *
     * @returns `undefined` if the value does not represent a valid date.
     */
    static fromString(value: string): DateValue | undefined {
        if (typeof value !== 'string') {
            throw new IllegalArgument('DateValue.fromString()');
        }
        return fromStringImpl(value, /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/, /^([0-9]{4})-([0-9]{2})-\*\*$/, /^([0-9]{4})-\*\*-\*\*$/, false);
    }


    /**
     * Get the date in a PGN format (e.g. `'2022.07.19'`, `'2022.07.??'` or `'2022.??.??'` depending on the type of the current object).
     */
    toPGNString(): string {
        return toStringImpl(this.#year, this.#month, this.#day, '.', '??');
    }


    /**
     * Parse the given value as a date in PGN format (e.g. `'2022.07.19'`, `'2022.07.??'` or `'2022.??.??'`).
     *
     * @returns `undefined` if the value does not represent a valid date.
     */
    static fromPGNString(value: string): DateValue | undefined {
        if (typeof value !== 'string') {
            throw new IllegalArgument('DateValue.fromPGNString()');
        }
        return fromStringImpl(value, /^([0-9]{4})\.([0-9]{2})\.([0-9]{2})$/, /^([0-9]{4})\.([0-9]{2})\.\?\?$/, /^([0-9]{4})(?:\.\?\?\.\?\?)?$/, true);
    }


    /**
     * Get the date of the game as a human-readable string (e.g. `'November 1955'`, `'September 4, 2021'`).
     *
     * @param locales - Locales to use to generate the result. If undefined, the default locale of the execution environment is used.
     *                  See [Intl documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
     *                  for more details.
     */
    toHumanReadableString(locales?: string | string[] | undefined): string {
        switch (this.#type) {
            case 'ymd': {
                const date = new Date(this.#year, this.#month! - 1, this.#day!);
                return new Intl.DateTimeFormat(locales, { dateStyle: 'long' }).format(date);
            }
            case 'ym': {
                const date = new Date(this.#year, this.#month! - 1, 1);
                return new Intl.DateTimeFormat(locales, { month: 'long', year: 'numeric' }).format(date);
            }
            default:
                return String(this.#year);
        }
    }


    /**
     * Whether the given year/month/day would corresponds to a valid date or not.
     */
    static isValid(year: number, month?: number, day?: number): boolean {
        return Boolean(computeType(year, month, day));
    }
}


function toStringImpl(year: number, month: number | undefined, day: number | undefined, separator: string, undefinedToken: string) {
    const y = String(year).padStart(4, '0');
    const m = month === undefined ? undefinedToken : String(month).padStart(2, '0');
    const d = day === undefined ? undefinedToken : String(day).padStart(2, '0');
    return y + separator + m + separator + d;
}


function fromStringImpl(value: string, ymdRe: RegExp, ymRe: RegExp, yRe: RegExp, tolerant: boolean) {
    if (ymdRe.test(value)) {
        const y = RegExp.$1;
        const m = RegExp.$2;
        const d = RegExp.$3;
        const year = parseInt(y, 10);
        const month = parseInt(m, 10);
        const day = parseInt(d, 10);
        if (DateValue.isValid(year, month, day)) {
            return new DateValue(year, month, day);
        }
        else if (tolerant) {
            return DateValue.isValid(year, month) ? new DateValue(year, month) : new DateValue(year);
        }
        else {
            return undefined;
        }
    }
    else if (ymRe.test(value)) {
        const y = RegExp.$1;
        const m = RegExp.$2;
        const year = parseInt(y, 10);
        const month = parseInt(m, 10);
        if (DateValue.isValid(year, month)) {
            return new DateValue(year, month);
        }
        else if (tolerant) {
            return new DateValue(year);
        }
        else {
            return undefined;
        }
    }
    else if (yRe.test(value)) {
        const year = parseInt(RegExp.$1, 10);
        return new DateValue(year);
    }
    else {
        return undefined;
    }
}


function computeType(year: number, month?: number, day?: number): false | 'y' | 'ym' | 'ymd' {
    if (day !== undefined && day !== null) {
        return isValidYear(year) && isValidMonth(month) && Number.isInteger(day) && day! >= 1 && day! <= daysInMonth(year, month!) ? 'ymd' : false;
    }
    else if (month !== undefined && month !== null) {
        return isValidYear(year) && isValidMonth(month) ? 'ym' : false;
    }
    else {
        return isValidYear(year) ? 'y' : false;
    }
}


function isValidYear(year: number) {
    return Number.isInteger(year) && year >= 0;
}


function isValidMonth(month: number | undefined) {
    return Number.isInteger(month) && month! >= 1 && month! <= 12;
}


function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}
