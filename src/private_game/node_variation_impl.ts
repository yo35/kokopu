/* -------------------------------------------------------------------------- *
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
 * -------------------------------------------------------------------------- */


import { Color } from '../base_types';
import { IllegalArgument, InvalidNotation } from '../exception';
import { i18n } from '../i18n';
import { MoveDescriptor } from '../move_descriptor';
import { Node, Variation } from '../node_variation';
import { Position } from '../position';


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

	findById(id: string) {
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
		else {
			const nodeData = findNode(variationData, lastToken, position);
			return nodeData === undefined ? undefined : new NodeImpl(nodeData, position);
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
	fullMoveNumber: number,
	moveDescriptor: MoveDescriptor | null, // `null` represents a null-move
}


function createNodeData(parentVariation: VariationData, moveColor: Color, fullMoveNumber: number, moveDescriptor: MoveDescriptor | null): NodeData {
	return {
		parentVariation: parentVariation,
		child: undefined,
		variations: [],
		moveColor: moveColor,
		fullMoveNumber: fullMoveNumber,
		moveDescriptor: moveDescriptor,
		nags: new Set(),
		tags: new Map(),
		comment: undefined,
		isLongComment: false,
	};
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
 * Whether the given value is a valid NAG or not.
 */
function isValidNag(nag: number) {
	return Number.isInteger(nag) && nag >= 0;
}


/**
 * Whether the given valid is a valid tag key or not.
 */
function isValidTagKey(tagKey: string) {
	return typeof tagKey === 'string' && /^\w+$/.test(tagKey);
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

	nags() {
		const result: number[] = [];
		for (const nag of this._data.nags) {
			result.push(nag);
		}
		return result.sort((a, b) => a - b);
	}

	hasNag(nag: number) {
		if (!isValidNag(nag)) {
			throw new IllegalArgument('Node.hasNag()');
		}
		return this._data.nags.has(nag);
	}

	addNag(nag: number) {
		if (!isValidNag(nag)) {
			throw new IllegalArgument('Node.addNag()');
		}
		return this._data.nags.add(nag);
	}

	removeNag(nag: number) {
		if (!isValidNag(nag)) {
			throw new IllegalArgument('Node.removeNag()');
		}
		return this._data.nags.delete(nag);
	}

	tags() {
		const result: string[] = [];
		for (const tag of this._data.tags.keys()) {
			result.push(tag);
		}
		return result.sort();
	}

	tag(tagKey: string, value?: string | undefined) {
		if (!isValidTagKey(tagKey)) {
			throw new IllegalArgument('Node.tag()');
		}
		if (arguments.length === 1) {
			return this._data.tags.get(tagKey);
		}
		else if (arguments.length >= 2) {
			if (value === undefined || value === null) {
				this._data.tags.delete(tagKey);
			}
			else {
				this._data.tags.set(tagKey, String(value));
			}
		}
		else {
			throw new IllegalArgument('Node.tag()');
		}
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
		return this._data.moveDescriptor === null ? '--' : this._positionBefore.notation(this._data.moveDescriptor);
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
		const nextFullMoveNumber = nextMoveColor === 'w' ? this._data.fullMoveNumber + 1: this._data.fullMoveNumber;
		this._data.child = createNodeData(this._data.parentVariation, nextMoveColor, nextFullMoveNumber, computeMoveDescriptor(nextPositionBefore, move));
		return new NodeImpl(this._data.child, nextPositionBefore);
	}

	removeFollowingMoves() {
		this._data.child = undefined;
	}

	addVariation(longVariation?: boolean) {
		const result = createVariationData(this._data, longVariation === undefined ? false : longVariation);
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

	nags() {
		const result: number[] = [];
		for (const nag of this._data.nags) {
			result.push(nag);
		}
		return result.sort((a, b) => a - b);
	}

	hasNag(nag: number) {
		if (!isValidNag(nag)) {
			throw new IllegalArgument('Variation.hasNag()');
		}
		return this._data.nags.has(nag);
	}

	addNag(nag: number) {
		if (!isValidNag(nag)) {
			throw new IllegalArgument('Variation.addNag()');
		}
		return this._data.nags.add(nag);
	}

	removeNag(nag: number) {
		if (!isValidNag(nag)) {
			throw new IllegalArgument('Variation.removeNag()');
		}
		return this._data.nags.delete(nag);
	}

	tags() {
		const result: string[] = [];
		for (const tag of this._data.tags.keys()) {
			result.push(tag);
		}
		return result.sort();
	}

	tag(tagKey: string, value?: string | undefined) {
		if (!isValidTagKey(tagKey)) {
			throw new IllegalArgument('Variation.tag()');
		}
		if (arguments.length === 1) {
			return this._data.tags.get(tagKey);
		}
		else if (arguments.length >= 2) {
			if (value === undefined || value === null) {
				this._data.tags.delete(tagKey);
			}
			else {
				this._data.tags.set(tagKey, String(value));
			}
		}
		else {
			throw new IllegalArgument('Variation.tag()');
		}
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

	isLongVariation() {
		return isLongVariation(this._data);
	}

	initialPosition() {
		return new Position(this._initialPosition);
	}

	initialFullMoveNumber() {
		return this._data.parent instanceof MoveTreeRoot ? this._data.parent._fullMoveNumber : this._data.parent.fullMoveNumber;
	}

	play(move: string) {
		const moveColor = this._initialPosition.turn();
		const fullMoveNumber = this.initialFullMoveNumber();
		this._data.child = createNodeData(this._data, moveColor, fullMoveNumber, computeMoveDescriptor(this._initialPosition, move));
		return new NodeImpl(this._data.child, this._initialPosition);
	}

	clearMoves() {
		this._data.child = undefined;
	}
}
