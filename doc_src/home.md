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
Method {@link pgnWrite} allows to write
a [PGN file](https://en.wikipedia.org/wiki/Portable_Game_Notation):
this method takes either {@link Database} or {@link Game} objects and writes them out
as a string representing the contents of a PGN file. This string could be written out
to file using the system's writeFile functions.
Method {@link jsonEncode} allows to write JSON with moves encoded into base64 binary
as described below.
Method {@link jsonDecode} allows to read JSON with moves encoded into base64 binary
as described below.

JSON MoveText encoding
----------------------

```
1. Byte Codes

A move needs 16 bits to be stored

bit  0- 5: destination square (from 0 to 63)
bit  6-11: origin square (from 0 to 63)
bit 12-14: promotion piece type: KNIGHT (1), BISHOP (2), ROOK (3), QUEEN (4)
Note: Castling is encoded as KxR of same color to handle both standard and chess 960.

Special cases are MOVE_NONE, MOVE_NULL, MOVE_SPECIAL. We can sneak these in
because in any normal move, destination square is almost always different from
origin square while MOVE_NONE, MOVE_NULL, MOVE_SPECIAL have the same origin
and destination square on squares where we can never have a piece stay on the
same square (MOVE_NONE=A1, MOVE_NULL=A2, MOVE_SPECIAL=A8).

enum Move : {
  MOVE_NONE = 0,
  MOVE_NULL = 65,
  MOVE_SPECIAL = 455
};

Special moves are MOVE_SPECIAL or'ed with:

0x1 << 12 [+]	annotation
				NAG code stored in next byte

0x0 .. 0xFF	    annotation (NAG codes 0 to 255)

0x2 << 12 [+]	text comment
				followed by text data (see 3.)
0x3 << 12 [+]	long text comment
				followed by text data (see 3.)

0x4 << 12 [+]	tag
				followed by tag as text (see 3.)
                followed by value as text (see 3.)

0x5 << 12		start of variation:
				following move data is a variation to the previous move
0x6 << 12		start of long variation:
				following move data is a variation to the previous move
0x7 << 12		end of variation

0x8 << 12 [+]	result
				result stored in next byte
				0 unknown, 1 black wins, 2 white wins, 3 draw

0xE << 12 [+]	extensions
				255 possible extension commands stored in next byte (1-255), 0 is reserved
				0	reserved
				1 [+] 	embedded image
					UInt64BE length in bytes followed by the embedded binary image bytes that may have encoding etc (up to implementation)
				2 [+] 	embedded audio
					UInt64BE length in bytes followed by the embedded binary audio bytes that may have encoding etc (up to implementation)
				3 [+]	embedded video
					UInt64BE length in bytes followed by the embedded binary video bytes that may have encoding etc (up to implementation)
				4-255	unused

0xF << 12		end of data

2. Encoding of text data

Comment text is stored as a sequence of UTF-8 encoded bytes, terminated by 0x00

| b1 | b2 | ... | 0x00 |
```

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
