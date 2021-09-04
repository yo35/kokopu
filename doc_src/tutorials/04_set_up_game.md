A `Game` object describes the total state of a chess game, i.e. the played moves, the corresponding positions,
the metadata associated to the game (players' names, date, etc...), and the annotations associated to the moves
(text comments, alternative moves considered by the annotator, [NAGs](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs),
etc...).

Since a Game object can hold several alternative moves proposed by an annotator, the moves are represented
through a tree-like structure (rather than a linear-like structure, as it would be the case if only the moves
actually played were considered). There are two secondary objects used to represent this tree structure:
- `Node` represents one move together with the annotations associated to this move. It gives access to the positions
before and after the move is played (see methods {@link Node#positionBefore} and {@link Node#position}).
It also gives access to the following move in the game (see {@link Node#next}), and the alternative moves - aka. the variations -
if any (see {@link Node#variations}).
- `Variation` represents a sequence of `Node` objects, aka a sequence of moves. A `Game` object holds a so-called "main variation"
(see {@link Game#mainVariation}) that is the root of the tree structure.

You can create a `Game` object from scratch as follows:

```
var kokopu = require('kokopu');

var game = new kokopu.Game();

// Set the player's names and event
game.playerName('w', 'Alice');
game.playerName('b', 'Bob');
game.event('1st International Open of Whatever');

// Start the main variation
var current = game.mainVariation(); // `current` points at a `Variation` object here
current = current.play('e4'); // `current` points at a `Node` object from now on
current = current.play('e5');

// Let's introduce an alternative to move 1...e5
var alternative1 = current.addVariation(); // `alternative1` points at a `Variation` object here
alternative1 = alternative1.play('c5'); // `alternative1` points at a `Node` object from now on
alternative1 = alternative1.play('Nf3');

// Let's introduce another alternative to move 1...e5
var alternative2 = current.addVariation(); // `alternative2` points at a `Variation` object here
alternative2 = alternative2.play('e6'); // `alternative2` points at a `Node` object from now on
alternative2 = alternative2.play('d4');

// Back to the main variation
current = current.play('Bc4');
current = current.play('Nc6');
current = current.play('Qh5');
current = current.play('Nf6');
current = current.play('Qxf7#');
current.comment('That is the Scholar\'s Mate');
game.result('1-0');
```
