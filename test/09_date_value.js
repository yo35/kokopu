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


const { exception, DateValue } = require('../dist/lib/index');
const assert = require('node:assert/strict');


function validateDateValue(dv, expectedType, expectedYear, expectedMonth, expectedDay) {
    assert.deepEqual(dv.type(), expectedType);
    assert.deepEqual(dv.year(), expectedYear);
    if (expectedMonth === null) {
        assert.throws(() => dv.month(), exception.IllegalArgument);
    }
    else {
        assert.deepEqual(dv.month(), expectedMonth);
    }
    if (expectedDay === null) {
        assert.throws(() => dv.day(), exception.IllegalArgument);
    }
    else {
        assert.deepEqual(dv.day(), expectedDay);
    }
}


describe('Date value attributes', () => {

    function itDateValue(label, expectedType, expectedYear, expectedMonth, expectedDay, expectedDate, expectedString, expectedPGNString,
        expectedReadableStringEN, expectedReadableStringFR, builder) {

        it(label + ' - Base attributes', () => {
            const dv = builder();
            validateDateValue(dv, expectedType, expectedYear, expectedMonth, expectedDay);
        });

        it(label + ' - Conversion to date', () => {
            const dv = builder();
            assert.deepEqual(dv.toDate(), expectedDate);
        });

        it(label + ' - Conversion to string', () => {
            const dv = builder();
            assert.deepEqual(dv.toString(), expectedString);
        });

        it(label + ' - Conversion to PGN string', () => {
            const dv = builder();
            assert.deepEqual(dv.toPGNString(), expectedPGNString);
        });

        it(label + ' - Conversion from string', () => {
            const dv = DateValue.fromString(expectedString);
            validateDateValue(dv, expectedType, expectedYear, expectedMonth, expectedDay);
        });

        it(label + ' - Conversion from PGN string', () => {
            const dv = DateValue.fromPGNString(expectedPGNString);
            validateDateValue(dv, expectedType, expectedYear, expectedMonth, expectedDay);
        });

        it(label + ' - Conversion to human readable string', () => {
            const dv = builder();
            assert.deepEqual(dv.toHumanReadableString('en-us'), expectedReadableStringEN);
            assert.deepEqual(dv.toHumanReadableString('fr'), expectedReadableStringFR);
        });
    }

    itDateValue('Full date 1', 'ymd', 1999, 11, 22, new Date(1999, 10, 22), '1999-11-22', '1999.11.22', 'November 22, 1999', '22 novembre 1999', () => new DateValue(1999, 11, 22));
    itDateValue('Full date 2', 'ymd', 1800, 1, 5, new Date(1800, 0, 5), '1800-01-05', '1800.01.05', 'January 5, 1800', '5 janvier 1800', () => new DateValue(1800, 1, 5));
    itDateValue('Full date 3', 'ymd', 2004, 2, 29, new Date(2004, 1, 29), '2004-02-29', '2004.02.29', 'February 29, 2004', '29 février 2004', () => new DateValue(2004, 2, 29));
    itDateValue('Full date 4', 'ymd', 2000, 2, 29, new Date(2000, 1, 29), '2000-02-29', '2000.02.29', 'February 29, 2000', '29 février 2000', () => new DateValue(2000, 2, 29));
    itDateValue('No day of month', 'ym', 2022, 8, null, new Date(2022, 7, 1), '2022-08-**', '2022.08.??', 'August 2022', 'août 2022', () => new DateValue(2022, 8));
    itDateValue('Year only', 'y', 2041, null, null, new Date(2041, 0, 1), '2041-**-**', '2041.??.??', '2041', '2041', () => new DateValue(2041));
    itDateValue('From date', 'ymd', 1995, 3, 18, new Date(1995, 2, 18), '1995-03-18', '1995.03.18', 'March 18, 1995', '18 mars 1995', () => new DateValue(new Date(1995, 2, 18)));
});


describe('Invalid date values', () => {

    function itInvalid(label, builder) {
        it(label, () => {
            assert.throws(builder, exception.IllegalArgument);
        });
    }

    itInvalid('Invalid month 1', () => new DateValue(1990, 0));
    itInvalid('Invalid month 2', () => new DateValue(1990, 13));
    itInvalid('Invalid day of month 1', () => new DateValue(1990, 1, 0));
    itInvalid('Invalid day of month 2', () => new DateValue(1990, 4, 31));
    itInvalid('Invalid day of month 3', () => new DateValue(1991, 2, 29));
    itInvalid('Invalid day of month 4', () => new DateValue(1900, 2, 29));

    itInvalid('From string', () => new DateValue('1990'));
    itInvalid('Negative year', () => new DateValue(-1));
});


describe('Invalid date value parsing', () => {

    function itValidValue(label, expectedType, expectedYear, expectedMonth, expectedDay, builder) {
        it(label, () => {
            const dv = builder();
            validateDateValue(dv, expectedType, expectedYear, expectedMonth, expectedDay);
        });
    }

    function itInvalidValue(label, builder) {
        it(label, () => {
            assert.deepEqual(builder(), undefined);
        });
    }

    itInvalidValue('Invalid month 1', () => DateValue.fromString('1990-00-**'));
    itInvalidValue('Invalid month 2', () => DateValue.fromString('1990-13-**'));
    itInvalidValue('Invalid day of month 1', () => DateValue.fromString('1990-01-00'));
    itInvalidValue('Invalid day of month 2', () => DateValue.fromString('1990-04-31'));
    itInvalidValue('Invalid day of month 3', () => DateValue.fromString('1991-02-29'));
    itInvalidValue('Invalid day of month 4', () => DateValue.fromString('1900-02-29'));

    itValidValue('Invalid month 1 (PGN)', 'y', 1990, null, null, () => DateValue.fromPGNString('1990.00.??'));
    itValidValue('Invalid month 2 (PGN)', 'y', 1990, null, null, () => DateValue.fromPGNString('1990.13.??'));
    itValidValue('Invalid day of month 1 (PGN)', 'ym', 1990, 1, null, () => DateValue.fromPGNString('1990.01.00'));
    itValidValue('Invalid day of month 2 (PGN)', 'ym', 1990, 4, null, () => DateValue.fromPGNString('1990.04.31'));
    itValidValue('Invalid day of month 3 (PGN)', 'ym', 1991, 2, null, () => DateValue.fromPGNString('1991.02.29'));
    itValidValue('Invalid day of month 4 (PGN)', 'ym', 1900, 2, null, () => DateValue.fromPGNString('1900.02.29'));

    itInvalidValue('Reading year', () => DateValue.fromString('1951'));
    itValidValue('Reading year (PGN)', 'y', 1951, null, null, () => DateValue.fromPGNString('1951'));

    itInvalidValue('Invalid separator', () => DateValue.fromString('1900.01.01'));
    itInvalidValue('Invalid PGN separator', () => DateValue.fromPGNString('1900-01-01'));

    function itInvalidArgument(label, value) {
        it(label, () => {
            assert.throws(() => DateValue.fromString(value), exception.IllegalArgument);
            assert.throws(() => DateValue.fromPGNString(value), exception.IllegalArgument);
        });
    }

    itInvalidArgument('From null', null);
    itInvalidArgument('From number', 1993);
});
