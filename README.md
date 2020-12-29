Kokopu
======

Kokopu is a JavaScript library for chess applications. It implements the chess game rules,
and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), etc.) as well as JSON
using its own binary format for compressing moves, annotations, comments, variations.

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
* [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) file parsing and writing (including advanced PGN features
such as commentaries, sub-variations, [NAGs](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs),
non-standard starting position...).
* Support [Chess960](https://en.wikipedia.org/wiki/Chess960) (also known as Fischer Random Chess).
* Support [JSON format](https://kokopu.yo35.org/docs/tutorial-05_json_reading_and_writing.html) input and output that includes compressing moves, annotations, commentary, etc.

Used by
-------

* [RPB Chessboard](https://wordpress.org/plugins/rpb-chessboard/), a chess plugin for WordPress.
