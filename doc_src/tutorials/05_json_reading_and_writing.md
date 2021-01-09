The library has its own JSON format that is able to be read and written using {@link jsonEncode} and {@link jsonDecode}.
The format has the {@link Game} headers as top level fields and all the 'movetext' section of the [Portable Game Notation](https://en.wikipedia.org/wiki/Portable_Game_Notation) file containing the moves, variations, commentary etc encoded into an internal binary
format as 'base64'. This allows us to safely store the binary data in a compressed form as JSON in a JSON datastore, for example, when
the Browser is running a Chess game using this library, and needs to save the game to a backend server running something like MongoDB.

The movedata section is compressed as follows:

JSON MoveText encoding
----------------------

```
1. Byte Codes

A move needs 16 bits to be stored

bit  0- 5: destination square (from 0 to 63)
bit  6-11: origin square (from 0 to 63)
bit 12-14: promotion piece type: KNIGHT (1), BISHOP (2), ROOK (3), QUEEN (4)
Note: Castling is stored as KxR of the same color

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
				1 [+] 	embedded audio
					UInt64BE length in bytes followed by the embedded binary audio bytes that may have encoding etc (up to implementation)
				2 [+]	embedded video
					UInt64BE length in bytes followed by the embedded binary video bytes that may have encoding etc (up to implementation)
				3-255	unused

0xF << 12		end of data

2. Encoding of text data

Comment text is stored as a sequence of UTF-8 encoded bytes, terminated by 0x00

| b1 | b2 | ... | 0x00 |

An example of a JSON file written for the [`example.pgn`](tutorial_data/example.pgn) file is shown at
[`example.json`](tutorial_data/example.json). Notice that the headers are the same as the PGN file with some slight changes for
Date to allow easy comparison on integers for dates and the additional fields MoveText and MainVariation. MoveText contains all the
moves as well as variations, commentary, annotations etc while MainVariation only contains the moves for the main variation to make
it easier for systems to search for particular positions, material etc without having to parse through variations or commentary.

The following example shows how to read and write the database from the kokopu internal JSON format:

```
var kokopu = require('kokopu');
var fs = require('fs');

// Read the content of the JSON file provided above.
var jsonText = fs.readFileSync('example.json', 'utf8');

// read the games in the database
var database = kokopu.jsonDecode(jsonText);

// Get the number of games in the PGN file.
database.gameCount(); // 2

// Retrieve the first game, and get information about it.
var firstGame = database.game(0);
firstGame.playerName('w'); // 'Bill Gates'
firstGame.playerName('b'); // 'Magnus Carlsen'
firstGame.date().toGMTString(); // 'Thu, 23 Jan 2014 05:00:00 GMT'
firstGame.result(); // '0-1'

// Display the moves that compose the main variation.
var mainVariation = firstGame.mainVariation();
mainVariation.nodes().map(function(node) { return node.notation(); });

// [ 'e4', 'Nc6', 'Nf3', 'd5', 'Bd3', 'Nf6', 'exd5', 'Qxd5', 'Nc3', 'Qh5',
// 'O-O', 'Bg4', 'h3', 'Ne5', 'hxg4', 'Nfxg4', 'Nxe5', 'Qh2#' ]

// ... assume database games have been modified with variations, commentary, had new games added, etc

var obj = kokopu.jsonEncode(database);

// write the string out to a new file 'my_new_database.json' in with the main variation and movetext as base64 encoded binary
// notice that the return value is an object that has to be JSON.stringfy()'ed before writing to the file.
fs.writeFileSync('my_new_database.json', JSON.stringify(obj), 'utf8');

```