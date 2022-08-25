Several ways are available to set-up a chess position:
- set-up from scratch,
- copy another position,
- load it from a [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string.



Set-up from scratch
-------------------

```
const { Position } = require('kokopu');

const position = new Position('empty'); // initialize the position with an empty board

position.square('a8', 'bk'); // put a black king on square a8
position.square('b6', 'wk'); // put a white king on square b6
position.square('a5', 'wr'); // put a white rook on square a5

console.log(position.ascii());
// +---+---+---+---+---+---+---+---+
// | k |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   | K |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// | R |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// w - -

// Check whether the position is valid or not, according to the chess rules.
position.isLegal(); // false, because black king is in check, but White is to play

// Set-up Black to play the first move
position.turn('b');
position.isLegal(); // true, since the first player is now properly configured

console.log(position.ascii());
// +---+---+---+---+---+---+---+---+
// | k |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   | K |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// | R |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// b - -
```

It is also possible to initialize the board from the usual starting position:

```
const { Position } = require('kokopu');

const position = new Position('start'); // initialize the position with the usual starting position

position.square('e5', 'wp'); // put a white pawn on square e5
position.square('e2', '-'); // clear square e2
position.square('d5', 'bp'); // put a black pawn on square d5
position.square('f5', 'bp'); // put a black pawn on square d5
position.square('d7', '-'); // clear square d7
position.square('f7', '-'); // clear square f7

position.enPassant('f'); // allow "en-passant" on file f

console.log(position.ascii());
// +---+---+---+---+---+---+---+---+
// | r | n | b | q | k | b | n | r |
// +---+---+---+---+---+---+---+---+
// | p | p | p |   | p |   | p | p |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   | p | P | p |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// | P | P | P | P |   | P | P | P |
// +---+---+---+---+---+---+---+---+
// | R | N | B | Q | K | B | N | R |
// +---+---+---+---+---+---+---+---+
// w KQkq f6

position.isMoveLegal('e5', 'd6'); // false
position.isMoveLegal('e5', 'f6'); // returns an object that evaluates to true when converted into a boolean
```



Copy another position
---------------------

```
const { Position } = require('kokopu');

const p1 = new Position('start');
p1.play('e4');

// Create a copy p2 of position p1. After the copy, each position can be modified without affecting the other.
const p2 = new Position(p1);

p1.play('e5');
p2.play('c5');

console.log(p1.ascii());
// +---+---+---+---+---+---+---+---+
// | r | n | b | q | k | b | n | r |
// +---+---+---+---+---+---+---+---+
// | p | p | p | p |   | p | p | p |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   | p |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   | P |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// | P | P | P | P |   | P | P | P |
// +---+---+---+---+---+---+---+---+
// | R | N | B | Q | K | B | N | R |
// +---+---+---+---+---+---+---+---+
// w KQkq -

console.log(p2.ascii());
// +---+---+---+---+---+---+---+---+
// | r | n | b | q | k | b | n | r |
// +---+---+---+---+---+---+---+---+
// | p | p |   | p | p | p | p | p |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   | p |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   | P |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// | P | P | P | P |   | P | P | P |
// +---+---+---+---+---+---+---+---+
// | R | N | B | Q | K | B | N | R |
// +---+---+---+---+---+---+---+---+
// w KQkq -
```



Load a FEN string
-----------------

The [Forsyth-Edwards Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) is a standard notation to describe a chess position,
that it is supported by many chess softwares. Kokopu is capable of loading such FEN strings.

```
const { Position } = require('kokopu');

// Load the FEN that characterizes the beginning of the Italian game variation.
const position = new Position('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3');

console.log(position.ascii());
// +---+---+---+---+---+---+---+---+
// | r |   | b | q | k | b | n | r |
// +---+---+---+---+---+---+---+---+
// | p | p | p | p |   | p | p | p |
// +---+---+---+---+---+---+---+---+
// |   |   | n |   |   |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   | p |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   | B |   | P |   |   |   |
// +---+---+---+---+---+---+---+---+
// |   |   |   |   |   | N |   |   |
// +---+---+---+---+---+---+---+---+
// | P | P | P | P |   | P | P | P |
// +---+---+---+---+---+---+---+---+
// | R | N | B | Q | K |   |   | R |
// +---+---+---+---+---+---+---+---+
// b KQkq -

// Play some moves, and return the resulting FEN string.
position.play('d6');
position.play('h3');
position.fen(); // 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N1P/PPPP1PP1/RNBQK2R b KQkq - 0 1'
```
