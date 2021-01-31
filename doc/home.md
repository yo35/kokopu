Kokopu documentation
====================

Kokopu is a JavaScript library for chess applications. It implements the chess game rules,
and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), etc.).

[https://www.npmjs.com/package/kokopu](https://www.npmjs.com/package/kokopu)



Installation
------------

- For use within a browser: [download the package](https://kokopu.yo35.org/dist/kokopu.zip)
and include either file `kokopu.js` or file `kokopu.min.js` in your HTML page.
- For Node.js:
```
npm install kokopu
```



Main classes and methods
------------------------

- {@link Position}: this class represents a chess position, i.e. the state of
a 64-square chessboard with a few additional information (who is about to play,
castling rights, en-passant rights).
It exposes methods to generate the moves that can be played in the position,
to check whether the position is check, checkmate or stalemate, to generate
the [FEN representation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
of the position, etc...
- {@link Game}: this class represents a chess game, with the move history,
the position at each step of the game, the comments and annotations (if any),
the result of the game, and some meta-data such as the name of the players,
the date of the game, the name of the tournament, etc...
- Method {@link pgnRead} allows to parse
a [PGN file](https://en.wikipedia.org/wiki/Portable_Game_Notation):
this method returns {@link Game} objects representing the content of the file.



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
