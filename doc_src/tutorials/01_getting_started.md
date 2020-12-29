This example shows how to create a chess position, how to play some moves, and how to retrieve some information about the resulting position.
More details available in {@link Position}.

```
var kokopu = require('kokopu');

// Create a new position, play some moves...
var position = new kokopu.Position();
position.play('e4');
position.play('e5');
position.play('Nf3');

// Display an ASCII-art representation of the position.
console.log(position.ascii());

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
// |   |   |   |   |   | N |   |   |
// +---+---+---+---+---+---+---+---+
// | P | P | P | P |   | P | P | P |
// +---+---+---+---+---+---+---+---+
// | R | N | B | Q | K | B |   | R |
// +---+---+---+---+---+---+---+---+
// b KQkq -

// Look at the content of individual squares.
position.square('f3'); // returns 'wn', standing for "white knight"
position.square('e7'); // returns '-', standing for an empty square

// Check the status of the position.
position.turn(); // 'b', i.e. black plays the next move
position.isCheck(); // false
position.isCheckmate(); // false
position.isStalemate(); // false

// Get the available moves.
var moves = position.moves();

// List the available moves in standard algebraic notation
moves.map(function(move) { return position.notation(move); });

// [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6', 'g5', 'h6', 'h5', 'Na6', 'Nc6',
// 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7', 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]

// List the available moves in figurine algebraic notation (you need a unicode font loaded that can display the chess
// symbols in unicode: https://en.wikipedia.org/wiki/Chess_symbols_in_Unicode)
moves.map(function(move) { return position.figurineNotation(move); });

// ['a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6', 'd5', 'f6', 'f5', 'g6', 'g5', 'h6', 'h5', '♞a6', '♞c6',
// '♛e7', '♛f6', '♛g5', '♛h4', '♚e7', '♝e7', '♝d6', '♝c5', '♝b4', '♝a3', '♞f6', '♞h6', '♞e7']

// Get the FEN representation of the position.
position.fen(); // 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 1'
```
