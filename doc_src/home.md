---

<img align="right" width="96" height="96" src="media://kokopu-logo.png" />

Kokopu is a JavaScript/TypeScript chess library.
It implements the chess game rules, and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation),
[UCI](https://en.wikipedia.org/wiki/Universal_Chess_Interface),
etc.).

[https://www.npmjs.com/package/kokopu](https://www.npmjs.com/package/kokopu)



Installation
------------

- For use within a browser: [download the package](https://kokopu.yo35.org/dist/kokopu.zip)
and include either file `kokopu.js` or file `kokopu.min.js` in your HTML page.
- For Node.js:
```
npm install kokopu
```



Migrate to 3.x and 4.x
----------------------

Versions 3.0.0 and 4.0.0 introduce some breaking changes with regard to the previous versions.
To determine whether your codebase needs to be adapted or not when upgrading Kokopu,
please look at:
- {@page migrate_to_4.md} to upgrade from 3.x to 4.0.0 (or any subsequent version).
- {@page migrate_to_3.md} and {@page migrate_to_4.md} to upgrade from 1.x or 2.x to 4.0.0 (or any subsequent version).



Main classes and functions
--------------------------

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
- Function {@link pgnRead} allows to parse
a [PGN file](https://en.wikipedia.org/wiki/Portable_Game_Notation):
this method returns {@link Game} objects representing the content of the file.
- Function {@link pgnWrite} allows to generate the [PGN string](https://en.wikipedia.org/wiki/Portable_Game_Notation)
corresponding to a {@link Game} object or an array of {@link Game} objects.



Example
-------

```
const { Position } = require('kokopu');

// Create a new position, play some moves...
const position = new Position();
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
const moves = position.moves();
console.log(moves.map(move => position.notation(move)));

// [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6',
// 'g5', 'h6', 'h5', 'Na6', 'Nc6', 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7',
// 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]
```

Or within a browser:

```
<script src="kokopu.js"></script>
<script>
    const position = new kokopu.Position();
    position.play('e4');
    position.play('e5');
    // etc...
</script>
```



References
----------

### Forsyth-Edwards Notation (FEN)

- [Wikipedia page](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [Chess Programming wiki](https://www.chessprogramming.org/Forsyth-Edwards_Notation)

### Universal Chess Interface (UCI)

- [Wikipedia page](https://en.wikipedia.org/wiki/Universal_Chess_Interface)
- [Chess Programming wiki](https://www.chessprogramming.org/UCI)
- [Protocol reference as published by Stefan Meyer-Kahlen](https://www.shredderchess.com/download/div/uci.zip)

### Standard Algebraic Notation (SAN)

- [Wikipedia page](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))
- [Chess Programming wiki](https://www.chessprogramming.org/Algebraic_Chess_Notation)

### Portable Game Notation (PGN)

- [Wikipedia page](https://en.wikipedia.org/wiki/Portable_Game_Notation)
- [Chess Programming wiki](https://www.chessprogramming.org/Portable_Game_Notation)
- [Format specification](https://ia802908.us.archive.org/26/items/pgn-standard-1994-03-12/PGN_standard_1994-03-12.txt)

### Encyclopaedia of Chess Openings codes (ECO)

- [Wikipedia page](https://en.wikipedia.org/wiki/List_of_chess_openings)
- [Chess Programming wiki](https://www.chessprogramming.org/ECO)

### Chess variants

- [Chess960](https://en.wikipedia.org/wiki/Chess960)
- [Antichess](https://en.wikipedia.org/wiki/Losing_chess)
- [Horde chess](https://en.wikipedia.org/wiki/Dunsany%27s_chess#Horde_chess)
