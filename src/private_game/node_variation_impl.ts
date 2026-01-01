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


import { Color, GameVariant } from '../base_types';
import { IllegalArgument, InvalidFEN, InvalidNotation } from '../exception';
import { AbstractNodePOJO, GamePOJO, NodePOJO, VariationPOJO } from '../game_pojo';
import { variantWithCanonicalStartPosition } from '../helper';
import { i18n } from '../i18n';
import { MoveDescriptor } from '../move_descriptor';
import { Node, Variation } from '../node_variation';
import { Position } from '../position';

import { isPositiveInteger } from './common';
import { POJOExceptionBuilder, decodeStringField, decodeBooleanField, decodeArrayField, decodeObjectField } from './pojo_util';
import { variantFromString } from '../private_position/base_types_impl';


/**
 * Container for the data at the root of the `NodeData` / `VariationData` tree.
 */
export class MoveTreeRoot {

    _position: Position;
    _fullMoveNumber: number;
    _mainVariationData: VariationData;

    constructor() {
        this._position = new Position();
        this._fullMoveNumber = 1;
        this._mainVariationData = createVariationData(this, true);
    }

    clearTree() {
        this._mainVariationData = createVariationData(this, true);
    }

    mainVariation() {
        return new VariationImpl(this._mainVariationData, this._position);
    }

    findById(id: string, allowAliases: boolean) {
        const tokens = id.split('-');
        if (tokens.length % 2 !== 1) {
            return undefined;
        }
        const position = new Position(this._position);

        // Find the parent variation of the target node.
        let variationData = this._mainVariationData;
        for (let i = 0; i + 1 < tokens.length; i += 2) {
            const nodeData = findNode(variationData, tokens[i], position);
            if (nodeData === undefined) {
                return undefined;
            }
            const match = /^v(\d+)$/.exec(tokens[i + 1]);
            if (!match) {
                return undefined;
            }
            const variationIndex = parseInt(match[1]);
            if (variationIndex >= nodeData.variations.length) {
                return undefined;
            }
            variationData = nodeData.variations[variationIndex];
        }

        // Find the target node within its parent variation, or return the variation itself
        // if the ID is a variation ID (i.e. if it ends with 'start').
        const lastToken = tokens[tokens.length - 1];
        if (lastToken === 'start') {
            return new VariationImpl(variationData, position);
        }
        else if (allowAliases && lastToken === 'end') {
            if (variationData.child === undefined) {
                return new VariationImpl(variationData, position);
            }
            else {
                let nodeData = variationData.child;
                while (nodeData.child !== undefined) {
                    applyMoveDescriptor(position, nodeData);
                    nodeData = nodeData.child;
                }
                return new NodeImpl(nodeData, position);
            }
        }
        else {
            const nodeData = findNode(variationData, lastToken, position);
            return nodeData === undefined ? undefined : new NodeImpl(nodeData, position);
        }
    }

    getPojo(pojo: GamePOJO) {

        // Encode the game variant and initial position, if necessary.
        const variant = this._position.variant();
        if (variant !== 'regular') {
            pojo.variant = variant;
        }
        const isCanonicalStartPosition = variantWithCanonicalStartPosition(variant) && Position.isEqual(this._position, new Position(variant)) && this._fullMoveNumber === 1;
        if (!isCanonicalStartPosition) {
            pojo.initialPosition = this._position.fen({ fullMoveNumber: this._fullMoveNumber });
        }

        // Encode the moves.
        const mainVariationPOJO = getVariationPOJO(new Position(this._position), this._mainVariationData, true);
        if (!Array.isArray(mainVariationPOJO) || mainVariationPOJO.length > 0) {
            pojo.mainVariation = mainVariationPOJO;
        }
    }

    setPojo(pojo: Partial<Record<string, unknown>>, exceptionBuilder: POJOExceptionBuilder) {

        // Decode the game variant and initial position, if any.
        let variant: GameVariant = 'regular';
        let initialPositionDefined = false;
        decodeStringField(pojo, 'variant', exceptionBuilder, value => {
            if (variantFromString(value) < 0) {
                throw exceptionBuilder.build(i18n.INVALID_VARIANT_IN_POJO);
            }
            variant = value as GameVariant;
        });
        decodeStringField(pojo, 'initialPosition', exceptionBuilder, value => {
            this._position = new Position(variant, 'empty');
            try {
                const { fullMoveNumber } = this._position.fen(value);
                this._fullMoveNumber = fullMoveNumber;
                initialPositionDefined = true;
            }
            catch (error) {
                // istanbul ignore else
                if (error instanceof InvalidFEN) {
                    throw exceptionBuilder.build(i18n.INVALID_FEN_IN_POJO, error.message);
                }
                else {
                    throw error;
                }
            }
        });
        if (variant !== 'regular' && !initialPositionDefined) {
            if (!variantWithCanonicalStartPosition(variant)) {
                exceptionBuilder.push('initialPosition'); // no-pop
                throw exceptionBuilder.build(i18n.MISSING_INITIAL_POSITION_IN_POJO, variant);
            }
            this._position = new Position(variant);
            this._fullMoveNumber = 1;
        }

        // Decode the moves.
        if ('mainVariation' in pojo && pojo.mainVariation !== undefined) {
            exceptionBuilder.push('mainVariation');
            this._mainVariationData = setVariationPOJO(pojo.mainVariation, this, this._position, 0, this._fullMoveNumber, true, exceptionBuilder);
            exceptionBuilder.pop();
        }
        else {
            this.clearTree();
        }
    }

}


function findNode(variationData: VariationData, nodeIdToken: string, position: Position) {
    let nodeData = variationData.child;
    while (nodeData !== undefined) {
        if (nodeIdToken === nodeData.fullMoveNumber + nodeData.moveColor) {
            return nodeData;
        }
        applyMoveDescriptor(position, nodeData);
        nodeData = nodeData.child;
    }
    return undefined;
}


function getVariationPOJO(position: Position, variationData: VariationData, isLongVariationByDefault: boolean): VariationPOJO {

    const nodePOJOs: NodePOJO[] = [];
    let nodeData = variationData.child;
    while (nodeData !== undefined) {
        nodePOJOs.push(getNodePOJO(position, nodeData));
        applyMoveDescriptor(position, nodeData);
        nodeData = nodeData.child;
    }

    const pojo: VariationPOJO = {
        nodes: nodePOJOs,
    };
    let pojoIsTrivial = true;

    if (variationData.isLongVariation !== isLongVariationByDefault) {
        pojo.isLongVariation = variationData.isLongVariation;
        pojoIsTrivial = false;
    }

    if (appendAnnotationFields(pojo, variationData)) {
        pojoIsTrivial = false;
    }
    return pojoIsTrivial ? pojo.nodes : pojo;
}


function getNodePOJO(position: Position, nodeData: NodeData): NodePOJO {

    const pojo: NodePOJO = {
        notation: getNodeDataNotation(position, nodeData),
    };
    let pojoIsTrivial = true;

    if (nodeData.variations.length > 0) {
        pojo.variations = nodeData.variations.map(variation => getVariationPOJO(new Position(position), variation, false));
        pojoIsTrivial = false;
    }

    if (appendAnnotationFields(pojo, nodeData)) {
        pojoIsTrivial = false;
    }
    return pojoIsTrivial ? pojo.notation : pojo;
}


function appendAnnotationFields(pojo: AbstractNodePOJO, data: AbstractNodeData) {
    let atLeastOneAnnotation = false;
    if (data.comment !== undefined) {
        pojo.comment = data.comment;
        if (data.isLongComment) {
            pojo.isLongComment = true;
        }
        atLeastOneAnnotation = true;
    }
    if (data.nags.size > 0) {
        pojo.nags = getNags(data);
        atLeastOneAnnotation = true;
    }
    if (data.tags.size > 0) {
        pojo.tags = getTagRecords(data);
        atLeastOneAnnotation = true;
    }
    return atLeastOneAnnotation;
}


function setVariationPOJO(variationPOJO: unknown, parent: NodeData | MoveTreeRoot, position: Position, fiftyMoveClock: number, fullMoveNumber: number,
    isLongVariationByDefault: boolean, exceptionBuilder: POJOExceptionBuilder): VariationData {

    let result: VariationData;
    let nodes: unknown[];

    // Initialize the VariationData object.
    if (Array.isArray(variationPOJO)) {
        result = createVariationData(parent, isLongVariationByDefault);
        nodes = variationPOJO;
    }
    else if (typeof variationPOJO === 'object' && variationPOJO !== null) {

        // Decode everything but the nodes.
        let longVariation = isLongVariationByDefault;
        decodeBooleanField(variationPOJO, 'isLongVariation', exceptionBuilder, value => { longVariation = value; });
        result = createVariationData(parent, longVariation);
        decodeAnnotationFields(variationPOJO, result, exceptionBuilder);

        // Decode the node array.
        exceptionBuilder.push('nodes');
        if (!('nodes' in variationPOJO) || !Array.isArray(variationPOJO.nodes)) {
            throw exceptionBuilder.build(i18n.INVALID_OR_MISSING_NODE_ARRAY);
        }
        nodes = variationPOJO.nodes;
    }
    else {
        throw exceptionBuilder.build(i18n.NOT_A_VARIATION_POJO);
    }

    // Decode the nodes.
    let insertionPoint: VariationData | NodeData = result;
    position = new Position(position);
    for (let i = 0; i < nodes.length; ++i) {

        exceptionBuilder.push(i);
        insertionPoint.child = setNodePOJO(nodes[i], result, position, fiftyMoveClock, fullMoveNumber, exceptionBuilder);
        exceptionBuilder.pop();

        insertionPoint = insertionPoint.child;
        applyMoveDescriptor(position, insertionPoint);
        fiftyMoveClock = computeNextFiftyMoveClock(insertionPoint);
        if (position.turn() === 'w') {
            ++fullMoveNumber;
        }
    }

    // Un-push the "nodes" path component if necessary.
    if (!Array.isArray(variationPOJO)) {
        exceptionBuilder.pop();
    }
    return result;
}


function setNodePOJO(nodePOJO: unknown, parentVariation: VariationData, position: Position, fiftyMoveClock: number, fullMoveNumber: number,
    exceptionBuilder: POJOExceptionBuilder): NodeData {

    // Decode the notation.
    let moveDescriptor: MoveDescriptor | null;
    if (typeof nodePOJO === 'string') {
        moveDescriptor = decodeMoveDescriptorField(position, nodePOJO, exceptionBuilder);
    }
    else if (typeof nodePOJO === 'object' && nodePOJO !== null) {
        exceptionBuilder.push('notation');
        if (!('notation' in nodePOJO) || typeof nodePOJO.notation !== 'string') {
            throw exceptionBuilder.build(i18n.INVALID_OR_MISSING_NOTATION_FIELD);
        }
        moveDescriptor = decodeMoveDescriptorField(position, nodePOJO.notation, exceptionBuilder);
        exceptionBuilder.pop();
    }
    else {
        throw exceptionBuilder.build(i18n.NOT_A_NODE_POJO);
    }

    const result = createNodeData(parentVariation, position.turn(), fiftyMoveClock, fullMoveNumber, moveDescriptor);
    if (typeof nodePOJO === 'object' && nodePOJO !== null) {

        // Decode the annotations.
        decodeAnnotationFields(nodePOJO, result, exceptionBuilder);

        // Decode the variations.
        decodeArrayField(nodePOJO, 'variations', exceptionBuilder, value => {
            for (let i = 0; i < value.length; ++i) {
                exceptionBuilder.push(i);
                result.variations.push(setVariationPOJO(value[i], result, position, fiftyMoveClock, fullMoveNumber, false, exceptionBuilder));
                exceptionBuilder.pop();
            }
        });
    }
    return result;
}


function decodeMoveDescriptorField(position: Position, move: string, exceptionBuilder: POJOExceptionBuilder): MoveDescriptor | null {
    try {
        return computeMoveDescriptor(position, move);
    }
    catch (error) {
        // istanbul ignore else
        if (error instanceof InvalidNotation) {
            throw exceptionBuilder.build(i18n.INVALID_MOVE_IN_POJO, move, error.message);
        }
        else {
            throw error;
        }
    }
}


function decodeAnnotationFields(abstractNodePOJO: Partial<Record<string, unknown>>, data: AbstractNodeData, exceptionBuilder: POJOExceptionBuilder) {

    decodeStringField(abstractNodePOJO, 'comment', exceptionBuilder, value => { data.comment = value; });
    decodeBooleanField(abstractNodePOJO, 'isLongComment', exceptionBuilder, value => { data.isLongComment = value; });

    decodeArrayField(abstractNodePOJO, 'nags', exceptionBuilder, value => {
        for (let i = 0; i < value.length; ++i) {
            const nag = value[i];
            if (nag === undefined) {
                continue;
            }
            else if (!isPositiveInteger(nag)) {
                exceptionBuilder.push(i); // no-pop
                throw exceptionBuilder.build(i18n.INVALID_NAG_IN_POJO, nag);
            }
            data.nags.add(nag as number);
        }
    });

    decodeObjectField(abstractNodePOJO, 'tags', exceptionBuilder, value => {
        for (const tagKey in value) {
            if (!isValidTagKey(tagKey)) {
                exceptionBuilder.push(`[${tagKey}]`); // no-pop
                throw exceptionBuilder.build(i18n.INVALID_TAG_IN_POJO, tagKey);
            }
            const tagValue = value[tagKey];
            if (tagValue === undefined) {
                continue;
            }
            else if (typeof tagValue !== 'string') {
                exceptionBuilder.push(tagKey); // no-pop
                throw exceptionBuilder.build(i18n.INVALID_TAG_IN_POJO, tagKey);
            }
            data.tags.set(tagKey, tagValue);
        }
    });
}


/**
 * Attributes shared between `NodeData` and `VariationData`.
 */
interface AbstractNodeData {

    // Annotations and comments associated to the underlying move or variation.
    nags: Set<number>,
    tags: Map<string, string>,
    comment?: string,
    isLongComment: boolean,
}


/**
 * Internal structure representing a `Node`.
 */
interface NodeData extends AbstractNodeData {

    // Links in the move tree.
    parentVariation: VariationData,
    child?: NodeData,
    variations: VariationData[],

    // Attributes of the current move.
    moveColor: Color,
    fiftyMoveClock: number, // Number of half-moves since the last pawn move or capture BEFORE the current move.
    fullMoveNumber: number,
    moveDescriptor: MoveDescriptor | null, // `null` represents a null-move

    // Computed attributes.
    notation: string | null, // `null` if not yet computed.
}


function createNodeData(parentVariation: VariationData, moveColor: Color, fiftyMoveClock: number, fullMoveNumber: number,
    moveDescriptor: MoveDescriptor | null): NodeData {
    return {
        parentVariation: parentVariation,
        child: undefined,
        variations: [],
        moveColor: moveColor,
        fiftyMoveClock: fiftyMoveClock,
        fullMoveNumber: fullMoveNumber,
        moveDescriptor: moveDescriptor,
        nags: new Set(),
        tags: new Map(),
        comment: undefined,
        isLongComment: false,
        notation: null,
    };
}


function getNodeDataNotation(position: Position, nodeData: NodeData): string {
    if (nodeData.notation === null) {
        nodeData.notation = nodeData.moveDescriptor === null ? '--' : position.notation(nodeData.moveDescriptor);
    }
    return nodeData.notation;
}


/**
 * Internal structure representing a `Variation`.
 */
interface VariationData extends AbstractNodeData {

    // Links in the move tree.
    parent: NodeData | MoveTreeRoot,
    child?: NodeData,

    // Attributes of the current variation.
    isLongVariation: boolean,
}


function createVariationData(parent: NodeData | MoveTreeRoot, longVariation: boolean): VariationData {
    return {
        parent: parent,
        child: undefined,
        isLongVariation: longVariation,
        nags: new Set(),
        tags: new Map(),
        comment: undefined,
        isLongComment: false,
    };
}


/**
 * Compute the move descriptor associated to the given SAN notation, assuming the given position.
 */
function computeMoveDescriptor(position: Position, move: string): MoveDescriptor | null {
    if (move === '--') {
        if (!position.isNullMoveLegal()) {
            throw new InvalidNotation(position.fen(), '--', i18n.ILLEGAL_NULL_MOVE);
        }
        return null;
    }
    else {
        return position.notation(move);
    }
}


/**
 * Play the move descriptor encoded in the given node data structure, or play null-move if no move descriptor is defined.
 */
function applyMoveDescriptor(position: Position, nodeData: NodeData) {
    if (nodeData.moveDescriptor === null) {
        position.playNullMove();
    }
    else {
        position.play(nodeData.moveDescriptor);
    }
}


/**
 * Compute the new value of the fifty-move clock after the move described by the given node data structure.
 */
function computeNextFiftyMoveClock(nodeData: NodeData) {
    if (nodeData.moveDescriptor === null) {
        return nodeData.fiftyMoveClock;
    }
    else if (nodeData.moveDescriptor.isCapture() || nodeData.moveDescriptor.movingPiece() === 'p') {
        return 0;
    }
    else {
        return nodeData.fiftyMoveClock + 1;
    }
}


/**
 * Compute the new value of the full-move number after the move described by the given node data structure.
 */
function computeNextFullMoveNumber(nodeData: NodeData) {
    return nodeData.moveColor === 'w' ? nodeData.fullMoveNumber : nodeData.fullMoveNumber + 1;
}


/**
 * Return the initial position of the given variation.
 */
function rebuildVariationPosition(variationData: VariationData): Position {
    if (variationData.parent instanceof MoveTreeRoot) {
        return new Position(variationData.parent._position);
    }
    else {
        let current = variationData.parent.parentVariation.child;
        const position = rebuildVariationPosition(variationData.parent.parentVariation);
        while (current !== variationData.parent) {
            applyMoveDescriptor(position, current!);
            current = current!.child;
        }
        return position;
    }
}


/**
 * Compute the ID of the given node.
 */
function buildNodeId(nodeData: NodeData): string {
    return buildVariationIdPrefix(nodeData.parentVariation) + nodeData.fullMoveNumber + nodeData.moveColor;
}


/**
 * Compute the ID of the given variation, without the final `'start'` token.
 */
function buildVariationIdPrefix(variationData: VariationData): string {
    if (variationData.parent instanceof MoveTreeRoot) {
        return '';
    }
    else {
        const parentNodeId = buildNodeId(variationData.parent);
        const variationIndex = variationData.parent.variations.indexOf(variationData);
        return `${parentNodeId}-v${variationIndex}-`;
    }
}


function buildFollowingNodeIdSuffix(fullMoveNumber: number, moveColor: Color, distance: number): string {
    let targetFullMoveNumber = fullMoveNumber + Math.trunc(distance / 2);
    let targetMoveColor = moveColor;
    if (distance % 2 === 1) {
        if (moveColor === 'w') {
            targetMoveColor = 'b';
        }
        else {
            targetFullMoveNumber++;
            targetMoveColor = 'w';
        }
    }
    return targetFullMoveNumber + targetMoveColor;
}


/**
 * Whether the variation corresponding to the given descriptor is a "long variation",
 * i.e. whether it is a flagged as "isLongVariation" AND SO ARE ALL IT'S PARENTS.
 */
function isLongVariation(variationData: VariationData) {
    while (true) {
        if (!variationData.isLongVariation) {
            return false;
        }
        if (variationData.parent instanceof MoveTreeRoot) {
            return true;
        }
        variationData = variationData.parent.parentVariation;
    }
}


/**
 * Whether the given number is a valid variation index for the given node.
 */
function isValidVariationIndex(variationIndex: number, nodeData: NodeData) {
    return Number.isInteger(variationIndex) && variationIndex >= 0 && variationIndex < nodeData.variations.length;
}


/**
 * Return all the NAGs of the given abstract node.
 */
function getNags(data: AbstractNodeData) {
    const result: number[] = [];
    for (const nag of data.nags) {
        result.push(nag);
    }
    return result.sort((a, b) => a - b);
}


/**
 * Keep only the NAGs that are asserted by the given filter.
 */
function filterNags(data: AbstractNodeData, filter: (nag: number) => boolean) {
    const result = new Set<number>();
    for (const nag of data.nags) {
        if (filter(nag)) {
            result.add(nag);
        }
    }
    data.nags = result;
}


/**
 * Whether the given valid is a valid tag key or not.
 */
function isValidTagKey(tagKey: string) {
    return typeof tagKey === 'string' && /^\w+$/.test(tagKey);
}


/**
 * Return all the tag keys of the given abstract node.
 */
function getTagKeys(data: AbstractNodeData) {
    const result: string[] = [];
    for (const tag of data.tags.keys()) {
        result.push(tag);
    }
    return result.sort();
}


/**
 * Keep only the tags that are asserted by the given filter.
 */
function filterTags(data: AbstractNodeData, filter: (tagKey: string, tagValue: string) => boolean) {
    const result = new Map<string, string>();
    for (const [ tagKey, tagValue ] of data.tags.entries()) {
        if (filter(tagKey, tagValue)) {
            result.set(tagKey, tagValue);
        }
    }
    data.tags = result;
}


/**
 * Return all the pairs tag key + tag value of the given abstract node.
 */
function getTagRecords(data: AbstractNodeData) {
    const result: Record<string, string> = {};
    for (const [ tagKey, tagValue ] of data.tags.entries()) {
        result[tagKey] = tagValue;
    }
    return result;
}


/**
 * Implementation class for `Node`.
 */
class NodeImpl extends Node {

    private _data: NodeData;
    private _positionBefore: Position;

    constructor(data: NodeData, positionBefore: Position) {
        super();
        this._data = data;
        this._positionBefore = positionBefore;
    }

    id() {
        return buildNodeId(this._data);
    }

    followingId(distance: number) {
        if (!isPositiveInteger(distance)) {
            throw new IllegalArgument('Node.followingId()');
        }
        return buildVariationIdPrefix(this._data.parentVariation) + buildFollowingNodeIdSuffix(this._data.fullMoveNumber, this._data.moveColor, distance);
    }

    nags() {
        return getNags(this._data);
    }

    hasNag(nag: number) {
        if (!isPositiveInteger(nag)) {
            throw new IllegalArgument('Node.hasNag()');
        }
        return this._data.nags.has(nag);
    }

    addNag(nag: number) {
        if (!isPositiveInteger(nag)) {
            throw new IllegalArgument('Node.addNag()');
        }
        return this._data.nags.add(nag);
    }

    removeNag(nag: number) {
        if (!isPositiveInteger(nag)) {
            throw new IllegalArgument('Node.removeNag()');
        }
        return this._data.nags.delete(nag);
    }

    clearNags() {
        this._data.nags.clear();
    }

    filterNags(filter: (nag: number) => boolean) {
        filterNags(this._data, filter);
    }

    tags() {
        return getTagKeys(this._data);
    }

    tag(tagKey: string, value?: string | undefined) {
        if (!isValidTagKey(tagKey)) {
            throw new IllegalArgument('Node.tag()');
        }
        if (arguments.length === 1) {
            return this._data.tags.get(tagKey);
        }
        else {
            if (value === undefined || value === null) {
                this._data.tags.delete(tagKey);
            }
            else {
                this._data.tags.set(tagKey, String(value));
            }
        }
    }

    clearTags() {
        this._data.tags.clear();
    }

    filterTags(filter: (tagKey: string, tagValue: string) => boolean) {
        filterTags(this._data, filter);
    }

    comment(value?: string | undefined, isLongComment?: boolean) {
        if (arguments.length === 0) {
            return this._data.comment;
        }
        else if (value === undefined || value === null) {
            this._data.comment = undefined;
            this._data.isLongComment = false;
        }
        else {
            this._data.comment = String(value);
            this._data.isLongComment = Boolean(isLongComment);
        }
    }

    isLongComment() {
        return this._data.isLongComment && isLongVariation(this._data.parentVariation);
    }

    parentVariation() {
        const initialPosition = rebuildVariationPosition(this._data.parentVariation);
        return new VariationImpl(this._data.parentVariation, initialPosition);
    }

    previous() {
        let current = this._data.parentVariation.child;
        if (current === this._data) {
            return undefined;
        }
        const position = rebuildVariationPosition(this._data.parentVariation);
        while (current!.child !== this._data) {
            applyMoveDescriptor(position, current!);
            current = current!.child;
        }
        return new NodeImpl(current!, position);
    }

    next() {
        if (this._data.child === undefined) {
            return undefined;
        }
        const nextPositionBefore = new Position(this._positionBefore);
        applyMoveDescriptor(nextPositionBefore, this._data);
        return new NodeImpl(this._data.child, nextPositionBefore);
    }

    notation() {
        return getNodeDataNotation(this._positionBefore, this._data);
    }

    figurineNotation() {
        return this._data.moveDescriptor === null ? '--' : this._positionBefore.figurineNotation(this._data.moveDescriptor);
    }

    positionBefore() {
        return new Position(this._positionBefore);
    }

    position() {
        const position = new Position(this._positionBefore);
        applyMoveDescriptor(position, this._data);
        return position;
    }

    fen() {
        return this.position().fen({
            fiftyMoveClock: computeNextFiftyMoveClock(this._data),
            fullMoveNumber: computeNextFullMoveNumber(this._data),
        });
    }

    fiftyMoveClock() {
        return computeNextFiftyMoveClock(this._data);
    }

    fullMoveNumber() {
        return this._data.fullMoveNumber;
    }

    moveColor() {
        return this._data.moveColor;
    }

    variations() {
        return this._data.variations.map(variation => new VariationImpl(variation, this._positionBefore) as Variation);
    }

    play(move: string) {
        const nextPositionBefore = new Position(this._positionBefore);
        applyMoveDescriptor(nextPositionBefore, this._data);
        const nextMoveColor = nextPositionBefore.turn();
        const nextFiftyMoveClock = computeNextFiftyMoveClock(this._data);
        const nextFullMoveNumber = computeNextFullMoveNumber(this._data);
        this._data.child = createNodeData(this._data.parentVariation, nextMoveColor, nextFiftyMoveClock, nextFullMoveNumber,
            computeMoveDescriptor(nextPositionBefore, move));
        return new NodeImpl(this._data.child, nextPositionBefore);
    }

    removePrecedingMoves() {
        const moveTreeRoot = findRoot(this._data);

        // Reset the initial position and full-move number, and rebuild a new main variation (so that the annotations get cleared).
        moveTreeRoot._position = this._positionBefore;
        moveTreeRoot._fullMoveNumber = this._data.fullMoveNumber;
        moveTreeRoot._mainVariationData = createVariationData(moveTreeRoot, true);

        // Replug the nodes.
        moveTreeRoot._mainVariationData.child = this._data;
        resetParentVariationRecursively(this._data, moveTreeRoot._mainVariationData);
        resetFiftyMoveClockRecursively(this._data, 0);
    }

    removeFollowingMoves() {
        this._data.child = undefined;
    }

    addVariation(longVariation?: boolean) {
        const result = createVariationData(this._data, longVariation ?? false);
        this._data.variations.push(result);
        return new VariationImpl(result, this._positionBefore);
    }

    removeVariation(variationIndex: number) {
        if (!isValidVariationIndex(variationIndex, this._data)) {
            throw new IllegalArgument('Node.removeVariation()');
        }
        this._data.variations = this._data.variations.slice(0, variationIndex).concat(this._data.variations.slice(variationIndex + 1));
    }

    swapVariations(variationIndex1: number, variationIndex2: number) {
        if (!isValidVariationIndex(variationIndex1, this._data) || !isValidVariationIndex(variationIndex2, this._data)) {
            throw new IllegalArgument('Node.swapVariations()');
        }
        const variationTmp = this._data.variations[variationIndex1];
        this._data.variations[variationIndex1] = this._data.variations[variationIndex2];
        this._data.variations[variationIndex2] = variationTmp;
    }

    promoteVariation(variationIndex: number) {
        if (!isValidVariationIndex(variationIndex, this._data) || this._data.variations[variationIndex].child === undefined) {
            throw new IllegalArgument('Node.promoteVariation()');
        }
        const oldMainLine = this._data;
        const newMainLine = this._data.variations[variationIndex].child!;

        // Detach the array containing the variations from the current node.
        const variations = oldMainLine.variations;
        oldMainLine.variations = [];

        // Create a new variation with the old main line.
        variations[variationIndex] = createVariationData(newMainLine, false);
        variations[variationIndex].child = oldMainLine;

        // Create a new main line with the promoted variation, and re-attach the variations.
        this._data = newMainLine;
        newMainLine.variations = variations.concat(newMainLine.variations);

        // Re-map the parents.
        findParent(oldMainLine).child = newMainLine;
        resetParentVariationRecursively(newMainLine, oldMainLine.parentVariation);
        resetParentVariationRecursively(oldMainLine, variations[variationIndex]);
        for (const variation of newMainLine.variations) {
            variation.parent = newMainLine;
        }
    }
}


function findRoot(node: NodeData) {
    let candidate: NodeData | MoveTreeRoot = node;
    while (!(candidate instanceof MoveTreeRoot)) {
        candidate = candidate.parentVariation.parent;
    }
    return candidate;
}


function findParent(oldMainLine: NodeData) {
    let candidate: NodeData | VariationData = oldMainLine.parentVariation;
    while (candidate.child !== oldMainLine) {
        candidate = candidate.child!;
    }
    return candidate;
}


function resetParentVariationRecursively(root: NodeData, newParentVariation: VariationData) {
    let current: NodeData | undefined = root;
    while (current !== undefined) {
        current.parentVariation = newParentVariation;
        current = current.child;
    }
}


function resetFiftyMoveClockRecursively(root: NodeData | undefined, fiftyMoveClock: number) {
    let current = root;
    while (current !== undefined) {

        // Update the current node.
        current.fiftyMoveClock = fiftyMoveClock;

        // Update its variations.
        for (const variation of current.variations) {
            resetFiftyMoveClockRecursively(variation.child, fiftyMoveClock);
        }

        fiftyMoveClock = computeNextFiftyMoveClock(current);
        current = current.child;
    }
}


/**
 * Implementation class for `Variation`.
 */
class VariationImpl extends Variation {

    private _data: VariationData;
    private _initialPosition: Position;

    constructor(data: VariationData, initialPosition: Position) {
        super();
        this._data = data;
        this._initialPosition = initialPosition;
    }

    id() {
        return buildVariationIdPrefix(this._data) + 'start';
    }

    followingId(distance: number) {
        if (!isPositiveInteger(distance)) {
            throw new IllegalArgument('Variation.followingId()');
        }
        const suffix = distance === 0 ? 'start' : buildFollowingNodeIdSuffix(this.initialFullMoveNumber(), this._initialPosition.turn(), distance - 1);
        return buildVariationIdPrefix(this._data) + suffix;
    }

    nags() {
        return getNags(this._data);
    }

    hasNag(nag: number) {
        if (!isPositiveInteger(nag)) {
            throw new IllegalArgument('Variation.hasNag()');
        }
        return this._data.nags.has(nag);
    }

    addNag(nag: number) {
        if (!isPositiveInteger(nag)) {
            throw new IllegalArgument('Variation.addNag()');
        }
        return this._data.nags.add(nag);
    }

    removeNag(nag: number) {
        if (!isPositiveInteger(nag)) {
            throw new IllegalArgument('Variation.removeNag()');
        }
        return this._data.nags.delete(nag);
    }

    clearNags() {
        this._data.nags.clear();
    }

    filterNags(filter: (nag: number) => boolean) {
        filterNags(this._data, filter);
    }

    tags() {
        return getTagKeys(this._data);
    }

    tag(tagKey: string, value?: string | undefined) {
        if (!isValidTagKey(tagKey)) {
            throw new IllegalArgument('Variation.tag()');
        }
        if (arguments.length === 1) {
            return this._data.tags.get(tagKey);
        }
        else {
            if (value === undefined || value === null) {
                this._data.tags.delete(tagKey);
            }
            else {
                this._data.tags.set(tagKey, String(value));
            }
        }
    }

    clearTags() {
        this._data.tags.clear();
    }

    filterTags(filter: (tagKey: string, tagValue: string) => boolean) {
        filterTags(this._data, filter);
    }

    comment(value?: string | undefined, isLongComment?: boolean) {
        if (arguments.length === 0) {
            return this._data.comment;
        }
        else if (value === undefined || value === null) {
            this._data.comment = undefined;
            this._data.isLongComment = false;
        }
        else {
            this._data.comment = String(value);
            this._data.isLongComment = Boolean(isLongComment);
        }
    }

    isLongComment() {
        return this._data.isLongComment && isLongVariation(this._data);
    }

    parentNode() {
        return this._data.parent instanceof MoveTreeRoot ? undefined : new NodeImpl(this._data.parent, this._initialPosition);
    }

    first() {
        return this._data.child === undefined ? undefined : new NodeImpl(this._data.child, this._initialPosition);
    }

    nodes() {
        const result: Node[] = [];
        let currentNodeData = this._data.child;
        let previousNodeData = undefined;
        let previousPositionBefore = this._initialPosition;
        while (currentNodeData !== undefined) {

            // Compute the "position-before" attribute the current node.
            previousPositionBefore = new Position(previousPositionBefore);
            if (previousNodeData !== undefined) {
                applyMoveDescriptor(previousPositionBefore, previousNodeData);
            }

            // Push the current node.
            result.push(new NodeImpl(currentNodeData, previousPositionBefore));

            // Increment the counters.
            previousNodeData = currentNodeData;
            currentNodeData = currentNodeData.child;
        }
        return result;
    }

    plyCount() {
        let result = 0;
        let currentNodeData = this._data.child;
        while (currentNodeData !== undefined) {
            ++result;
            currentNodeData = currentNodeData.child;
        }
        return result;
    }

    isLongVariation() {
        return isLongVariation(this._data);
    }

    initialPosition() {
        return new Position(this._initialPosition);
    }

    initialFEN() {
        return this._initialPosition.fen({
            fiftyMoveClock: this.initialFiftyMoveClock(),
            fullMoveNumber: this.initialFullMoveNumber(),
        });
    }

    initialFiftyMoveClock() {
        return this._data.parent instanceof MoveTreeRoot ? 0 : this._data.parent.fiftyMoveClock;
    }

    initialFullMoveNumber() {
        return this._data.parent instanceof MoveTreeRoot ? this._data.parent._fullMoveNumber : this._data.parent.fullMoveNumber;
    }

    finalPosition() {
        const result = new Position(this._initialPosition);
        for (let nodeData = this._data.child; nodeData !== undefined; nodeData = nodeData.child) {
            applyMoveDescriptor(result, nodeData);
        }
        return result;
    }

    finalFEN() {
        if (this._data.child === undefined) {
            return this.initialFEN();
        }
        const position = new Position(this._initialPosition);
        let nodeData = this._data.child;
        while (true) {
            applyMoveDescriptor(position, nodeData);
            if (nodeData.child === undefined) {
                break;
            }
            nodeData = nodeData.child;
        }
        return position.fen({
            fiftyMoveClock: computeNextFiftyMoveClock(nodeData),
            fullMoveNumber: computeNextFullMoveNumber(nodeData),
        });
    }

    play(move: string) {
        const moveColor = this._initialPosition.turn();
        const fiftyMoveClock = this.initialFiftyMoveClock();
        const fullMoveNumber = this.initialFullMoveNumber();
        this._data.child = createNodeData(this._data, moveColor, fiftyMoveClock, fullMoveNumber, computeMoveDescriptor(this._initialPosition, move));
        return new NodeImpl(this._data.child, this._initialPosition);
    }

    clearMoves() {
        this._data.child = undefined;
    }
}
