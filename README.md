Kokopu
======

<img align="right" width="96" height="96" src="graphics/logo.svg" />

Kokopu is a JavaScript library for chess applications. It implements the chess game rules,
and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation),
[UCI](https://en.wikipedia.org/wiki/Universal_Chess_Interface),
etc.).

https://www.npmjs.com/package/kokopu

[![Build Status](https://travis-ci.com/yo35/kokopu.svg?branch=master)](https://travis-ci.com/yo35/kokopu)
[![Coverage Status](https://coveralls.io/repos/github/yo35/kokopu/badge.svg?branch=master)](https://coveralls.io/github/yo35/kokopu?branch=master)



Download
--------

https://kokopu.yo35.org/dist/kokopu.zip



Documentation
-------------

https://kokopu.yo35.org/



Features
--------

* Chess move generation.
* Check, checkmate and stalemate detection.
* Move legality check.
* [Algrebraic notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) parsing and generation. 
* [FEN notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) parsing and generation.
* [UCI move](https://en.wikipedia.org/wiki/Universal_Chess_Interface) parsing and generation.
* [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) file parsing and generation (including advanced PGN features
such as commentaries, sub-variations, [NAGs](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs),
non-standard starting position...).
* Support several chess variants:
  - [Chess960](https://en.wikipedia.org/wiki/Chess960), also known as Fischer Random Chess.
  - [Antichess](https://en.wikipedia.org/wiki/Losing_chess), also known as losing chess, giveaway chess, suicide chess...
  - [Horde chess](https://en.wikipedia.org/wiki/Dunsany%27s_chess#Horde_chess) (following Lichess/Chess.com rules).

Kokopu is a headless library, meaning it does not provide any user interface.
If you are interested in UI features (e.g. to be able to render a chessboard component within a web page),
you may take a look at [Kokopu-React](https://www.npmjs.com/package/kokopu-react), which is a [React](https://reactjs.org/)-based library
built on top of Kokopu to provide these kind of features.



Example
-------

```javascript
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

// List the available moves.
var moves = position.moves();
console.log(moves.map(function(move) {
  return position.notation(move);
}));

// [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6',
// 'g5', 'h6', 'h5', 'Na6', 'Nc6', 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7',
// 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]
```

More examples available in [documentation](https://kokopu.yo35.org/).
