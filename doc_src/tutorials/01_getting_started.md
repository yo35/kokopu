---
title: Getting started
---


Getting started
===============

This example shows how to create a chess position, how to play some moves, and how to retrieve some information about the resulting position.
More details available in {@link Position}.

```
const { Position } = require('kokopu');

// Create a new position, play some moves...
const position = new Position();
position.play('e4');
position.play('e5');
position.play('Nf3');

// Display an ASCII-art representation of the position.
console.log(position.ascii({ coordinateVisible: true }));

//   +---+---+---+---+---+---+---+---+
// 8 | r | n | b | q | k | b | n | r |
//   +---+---+---+---+---+---+---+---+
// 7 | p | p | p | p |   | p | p | p |
//   +---+---+---+---+---+---+---+---+
// 6 |   |   |   |   |   |   |   |   |
//   +---+---+---+---+---+---+---+---+
// 5 |   |   |   |   | p |   |   |   |
//   +---+---+---+---+---+---+---+---+
// 4 |   |   |   |   | P |   |   |   |
//   +---+---+---+---+---+---+---+---+
// 3 |   |   |   |   |   | N |   |   |
//   +---+---+---+---+---+---+---+---+
// 2 | P | P | P | P |   | P | P | P |
//   +---+---+---+---+---+---+---+---+
// 1 | R | N | B | Q | K | B |   | R |
//   +---+---+---+---+---+---+---+---+
//     a   b   c   d   e   f   g   h
// b KQkq -

// Look at the content of individual squares.
position.square('f3'); // returns 'wn', standing for "white knight"
position.square('e7'); // returns '-', standing for an empty square

// Check the status of the position.
position.turn(); // 'b', i.e. black plays the next move
position.isCheck(); // false
position.isCheckmate(); // false
position.isStalemate(); // false

// List the available moves.
const moves = position.moves();
moves.map(move => position.notation(move)); // or position.figurineNotation(move)

// [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6',
// 'g5', 'h6', 'h5', 'Na6', 'Nc6', 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7',
// 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]

// Get the FEN representation of the position.
position.fen(); // 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 1'
```
