Kokopu documentation
====================

Kokopu is a JavaScript library for chess applications. It implements the chess game rules,
and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), etc.).

[https://www.npmjs.com/package/kokopu](https://www.npmjs.com/package/kokopu)



Main classes
------------

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
Method {@link pgnRead} allows to parse
a [PGN file](https://en.wikipedia.org/wiki/Portable_Game_Notation):
this method returns {@link Game} objects representing the content of the file.



Examples
--------

TODO
