This example shows how to write out a [Portable Game Notation](https://en.wikipedia.org/wiki/Portable_Game_Notation) file
after games have already been loaded into memory as shown in the previous example for [`Loading a PGN file`](03_loading_pgn.md)
and with games that have possibly been edited with additional commentary or variations or had more games added to it in memory.

```
var kokopu = require('kokopu');
var fs = require('fs');

// Read the content of the PGN file provided above.
var pgnText = fs.readFileSync('example.pgn', 'utf8');

// Parse this content.
var database = kokopu.pgnRead(pgnText);

// ... assume database games have been modified with variations, commentary, had new games added, etc

// write out the games in the database into PGN format.
var pgn = kokopu.pgnWrite(database);

// write the string out to a new file 'my_new_database.pgn' in utf8 (PGN are in utf8)
fs.writeFileSync('my_new_database.pgn', pgn, 'utf8');
```