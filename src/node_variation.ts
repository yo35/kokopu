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


import { Color } from './base_types';
import { Position } from './position';


/**
 * Base class for {@link Node} and {@link Variation}.
 */
export abstract class AbstractNode {

	/**
	 * @ignore
	 */
	protected constructor() {}

	/**
	 * Identifier of the current {@link Node} or {@link Variation} within its parent {@link Game}.
	 *
	 * WARNING: the ID may change when variations are modified (added, removed, swapped, promoted...)
	 * among the parents the current node.
	 */
	abstract id(): string;

	/**
	 * @deprecated Use `obj instanceof Variation` instead.
	 */
	abstract isVariation(): boolean;

	/**
	 * [NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs)s associated to the current node or variation.
	 *
	 * @returns array sorted in increasing order.
	 */
	abstract nags(): number[];

	/**
	 * Check whether the current node or variation has the given [NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs) or not.
	 */
	abstract hasNag(nag: number): boolean;

	/**
	 * Add the given [NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs) to the current node or variation.
	 */
	abstract addNag(nag: number): void;

	/**
	 * Remove the given [NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs) from the current node or variation.
	 */
	abstract removeNag(nag: number): void;

	/**
	 * Return the keys of the tags associated to the current node or variation.
	 *
	 * The tag mechanism is a key-value associative container allowing to store some arbitrary data
	 * on each node or variation. In PGN, the tags are represented as `[%tagKey tagValue]` strings
	 * appended to text comments.
	 *
	 * The tag keys must be non-empty, and can contain only alphanumeric or underscore characters.
	 *
	 * @returns array sorted in increasing order.
	 */
	abstract tags(): string[];

	/**
	 * Get the value associated to the given tag key on the current node or variation.
	 *
	 * @see {@link AbstractNode.tags} for more details on tags.
	 */
	abstract tag(tagKey: string): string | undefined;

	/**
	 * Set the value associated to the given tag key on the current node or variation.
	 *
	 * @see {@link AbstractNode.tags} for more details on tags.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 */
	abstract tag(tagKey: string, value: string | undefined): void;

	/**
	 * Get the text comment (if any) associated to the current node or variation.
	 */
	abstract comment(): string | undefined;

	/**
	 * Set the text comment associated to the current node or variation.
	 *
	 * @param value - If `undefined`, the existing value (if any) is erased.
	 * @param isLongComment - `false` by default.
	 */
	abstract comment(value: string | undefined, isLongComment?: boolean): void;

	/**
	 * Whether the text comment associated to the current node or variation is long or short.
	 *
	 * @returns `false` if no comment is defined.
	 */
	abstract isLongComment(): boolean;

	/**
	 * Create a new node representing the given move, and append it to the current node or variation.
	 *
	 * If there are some pre-existing subsequent nodes, they are all erased.
	 *
	 * @param move - [SAN](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) representation of the move, or `'--'` for a null-move.
	 * @returns The newly created {@link Node}.
	 * @throws {@link exception.InvalidNotation} if the move notation cannot be parsed, or if the parsed move would correspond to an illegal move.
	 */
	abstract play(move: string): Node;
}


/**
 * Represent one move in the tree structure formed by a chess game with multiple variations.
 */
export abstract class Node extends AbstractNode {

	/**
	 * @ignore
	 */
	protected constructor() {
		super();
	}

	/**
	 * Return the {@link Variation} that owns the current node.
	 */
	abstract parentVariation(): Variation;

	/**
	 * Return the {@link Node} that comes before the current one in their parent variation.
	 *
	 * @returns `undefined` if the current node is the first one of the variation.
	 */
	abstract previous(): Node | undefined;

	/**
	 * Return the {@link Node} that comes after the current one in their parent variation.
	 *
	 * @returns `undefined` if the current node is the last one of the variation.
	 */
	abstract next(): Node | undefined;

	/**
	 * [SAN](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) representation of the move
	 * associated to the current node (or `'--'` for a null-move).
	 */
	abstract notation(): string;

	/**
	 * [SAN](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))-like representation of the move
	 * associated to the current node (or `'--'` for a null-move).
	 *
	 * Here, chess pieces are represented with their respective unicode character, instead of the first letter of their English name.
	 */
	abstract figurineNotation(): string;

	/**
	 * Chess position before the current move.
	 */
	abstract positionBefore(): Position;

	/**
	 * Chess position obtained after the current move.
	 */
	abstract position(): Position;

	/**
	 * Full-move number. It starts at 1 (by default), and is incremented after each black move.
	 */
	abstract fullMoveNumber(): number;

	/**
	 * Color of the player who plays the current move.
	 */
	abstract moveColor(): Color;

	/**
	 * Alternative variations that can be followed instead of the current move.
	 */
	abstract variations(): Variation[];

	/**
	 * Erase all the moves after the one on the current {@link Node}: after that, {@link Node.next} returns `undefined`.
	 *
	 * If the current {@link Node} is already the last one in its variation (i.e. if {@link Node.next} returns `undefined` already),
	 * nothing happens.
	 */
	abstract removeFollowingMoves(): void;

	/**
	 * Create a new variation that can be played instead of the current move.
	 *
	 * @param isLongVariation - `false` by default.
	 */
	abstract addVariation(isLongVariation?: boolean): Variation;

	/**
	 * Remove the variation corresponding to the given index.
	 *
	 * @param variationIndex - Index of the variation to remove (must be such that `0 <= variationIndex < thisNode.variations().length`).
	 */
	abstract removeVariation(variationIndex: number): void;

	/**
	 * Change the order of the variations by swapping the two variations corresponding to the given indexes.
	 *
	 * @param variationIndex1 - Index of one variation to swap (must be such that `0 <= variationIndex1 < thisNode.variations().length`).
	 * @param variationIndex2 - Index of the other variation to swap (must be such that `0 <= variationIndex2 < thisNode.variations().length`).
	 */
	abstract swapVariations(variationIndex1: number, variationIndex2: number): void;

	/**
	 * Replace the move on the current node (and the following ones, if any) by the moves of the variation corresponding to the given index,
	 * and create a new variation with the move on the current node and its successors.
	 *
	 * WARNING: the promoted variation must NOT be empty (otherwise an exception is thrown).
	 *
	 * @param variationIndex - Index of the variation to promote (must be such that `0 <= variationIndex < thisNode.variations().length`).
	 */
	abstract promoteVariation(variationIndex: number): void;

	/**
	 * @deprecated Use `obj instanceof Variation` instead.
	 */
	isVariation(): boolean {
		return false;
	}

	/**
	 * @ignore
	 */
	toString(): string {
		return `${this.id()}[${this.notation()}]`;
	}
}


/**
 * Represent one variation in the tree structure formed by a chess game, meaning a starting chess position and
 * a list of moves played consecutively from this position.
 */
export abstract class Variation extends AbstractNode {

	/**
	 * @ignore
	 */
	protected constructor() {
		super();
	}

	/**
	 * Return the {@link Node} to which the current variation is attached.
	 *
	 * @returns `undefined` if the current variation is the main one (see {@link Game.mainVariation}).
	 */
	abstract parentNode(): Node | undefined;

	/**
	 * Return the first {@link Node} of the current variation.
	 *
	 * @returns `undefined` if the current variation is empty.
	 */
	abstract first(): Node | undefined;

	/**
	 * Return the nodes corresponding to the moves of the current variation.
	 */
	abstract nodes(): Node[];

	/**
	 * Whether the current variation is considered as a "long" variation, i.e. a variation that should be displayed in an isolated block.
	 */
	abstract isLongVariation(): boolean;

	/**
	 * Chess position at the beginning of the variation.
	 */
	abstract initialPosition(): Position;

	/**
	 * Full-move number at the beginning of the variation (see {@link Node.fullMoveNumber}).
	 */
	abstract initialFullMoveNumber(): number;

	/**
	 * Erase all the moves in the current {@link Variation}: after that, {@link Variation.first} returns `undefined`.
	 *
	 * If the current {@link Variation} is already empty (i.e. if {@link Variation.first} returns `undefined` already),
	 * nothing happens.
	 */
	abstract clearMoves(): void;

	/**
	 * @deprecated Use `obj instanceof Variation` instead.
	 */
	isVariation(): boolean {
		return true;
	}

	/**
	 * @ignore
	 */
	toString(): string {
		return this.id();
	}
}
