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


const { Position } = require('../../dist/lib/index');


const ID_PADDING = '                        ';


/**
 * Dump the content of a Game object.
 */
module.exports = function (game) {
    let res = '\n';

    function dumpHeader(key, value) {
        if (value !== undefined) {
            res += key + ' = {' + value + '}\n';
        }
    }

    function dumpResultAndPlyCount(result, plyCount) {
        res += '{';
        switch (result) {
            case '1-0': res += 'White wins'; break;
            case '0-1': res += 'Black wins'; break;
            case '1/2-1/2': res += 'Draw'; break;
            case '*': res += 'Line'; break;
            default: break;
        }
        res += `}{${plyCount} plies}\n`;
    }

    function dumpVariant(variant) {
        if (variant !== 'regular') {
            res += `Variant = {${variant}}\n`;
        }
    }

    function dumpInitialPosition(position) {
        if (position.fen() !== new Position().fen()) {
            res += position.ascii() + '\n';
        }
    }

    function dumpInitialMoveNumber(moveNumber) {
        if (moveNumber !== 1) {
            res += `Initial move number = {${moveNumber}}\n`;
        }
    }

    function dumpNags(node) {
        for (const nag of node.nags()) {
            res += ' $' + nag;
        }
    }

    function dumpTags(node) {
        for (const key of node.tags()) {
            res += ` [${key} = {${node.tag(key)}}]`;
        }
    }

    function dumpComment(node) {
        const comment = node.comment();
        if (comment !== undefined) {
            res += ` {${node.comment()}}`;
            if (node.isLongComment()) {
                res += '<LONG';
            }
        }
    }

    function formatNodeOrVariationId(id) {
        let result = `[${id}]`;
        if (result.length < ID_PADDING.length) {
            result += ' '.repeat(ID_PADDING.length - result.length);
        }
        return result;
    }

    function dumpNode(node, indent) {

        // Describe the move
        res += `${formatNodeOrVariationId(node.id())}${indent}(${node.fullMoveNumber()}${node.moveColor()}) ${node.notation()} (#hm=${node.fiftyMoveClock()})`;
        dumpNags(node);
        dumpTags(node);
        dumpComment(node);
        res += '\n';

        // Print the sub-variations
        const subVariations = node.variations();
        for (const subVariation of subVariations) {
            res += ID_PADDING + indent + ' |\n';
            dumpVariation(subVariation, indent + ' |  ', indent + ' +--');
        }
        if (subVariations.length > 0) {
            res += ID_PADDING + indent + ' |\n';
        }
    }

    // Recursive function to dump a variation.
    function dumpVariation(variation, indent, indentFirst) {

        // Variation header
        res += formatNodeOrVariationId(variation.id()) + indentFirst + '-+';
        if (variation.isLongVariation()) {
            res += '<LONG';
        }
        dumpNags(variation);
        dumpTags(variation);
        dumpComment(variation);
        res += '\n';

        // List of moves
        let node = variation.first();
        while (node !== undefined) {
            dumpNode(node, indent);
            node = node.next();
        }
    }

    dumpHeader('White', game.playerName('w'));
    dumpHeader('WhiteElo', game.playerElo('w'));
    dumpHeader('WhiteTitle', game.playerTitle('w'));
    dumpHeader('Black', game.playerName('b'));
    dumpHeader('BlackElo', game.playerElo('b'));
    dumpHeader('BlackTitle', game.playerTitle('b'));
    dumpHeader('Event', game.event());
    dumpHeader('Round', game.round());
    dumpHeader('SubRound', game.subRound());
    dumpHeader('SubSubRound', game.subSubRound());
    dumpHeader('Site', game.site());
    dumpHeader('Date', game.date());
    dumpHeader('Annotator', game.annotator());
    dumpHeader('ECO', game.eco());
    dumpHeader('Opening', game.opening());
    dumpHeader('OpeningVariation', game.openingVariation());
    dumpHeader('OpeningSubVariation', game.openingSubVariation());
    dumpHeader('Termination', game.termination());
    dumpVariant(game.variant());
    dumpInitialPosition(game.initialPosition());
    dumpInitialMoveNumber(game.initialFullMoveNumber());
    dumpVariation(game.mainVariation(), '', '');
    res += game.finalPosition().ascii() + '\n';
    dumpResultAndPlyCount(game.result(), game.plyCount());

    return res;
};
