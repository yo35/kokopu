Kokopu
======

Kokopu is a JavaScript library for chess applications. It implements the chess game rules,
and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation),
[UCI](https://en.wikipedia.org/wiki/Universal_Chess_Interface),
etc.).

https://www.npmjs.com/package/kokopu

[![Build Status](https://travis-ci.com/yo35/kokopu.svg?branch=master)](https://travis-ci.com/yo35/kokopu)



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
* [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) file parsing (including advanced PGN features
such as commentaries, sub-variations, [NAGs](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs),
non-standard starting position...).
* Support [Chess960](https://en.wikipedia.org/wiki/Chess960) (also known as Fischer Random Chess).



Used by
-------

* [RPB Chessboard](https://wordpress.org/plugins/rpb-chessboard/), a chess plugin for WordPress.



Example
-------

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

// List the available moves.
var moves = position.moves();
console.log(moves.map(function(move) { return position.notation(move); }));

// [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6', 'g5', 'h6', 'h5', 'Na6', 'Nc6',
// 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7', 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]
```

Or within a browser:

```
<script src="kokopu.js"></script>
<script>
	var position = new kokopu.Position();
	position.play('e4');
	position.play('e5');
	// etc...
</script>
```
