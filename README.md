Kokopu
======

<img align="right" width="96" height="96" src="graphics/logo.svg" />

Kokopu is a JavaScript/TypeScript chess library.
It implements the chess game rules, and provides tools to read/write the standard chess file formats
([PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation),
[FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation),
[UCI](https://en.wikipedia.org/wiki/Universal_Chess_Interface),
etc.).

![NPM Version](https://img.shields.io/npm/v/kokopu)
![NPM Last Update](https://img.shields.io/npm/last-update/kokopu)
![NPM Downloads](https://img.shields.io/npm/dw/kokopu)
[![Build Status](https://github.com/yo35/kokopu/actions/workflows/main.yml/badge.svg)](https://github.com/yo35/kokopu/actions/workflows/main.yml)
[![Coverage Status](https://coveralls.io/repos/github/yo35/kokopu/badge.svg?branch=master)](https://coveralls.io/github/yo35/kokopu?branch=master)



Documentation
-------------

https://kokopu.yo35.org/



Installation
------------

- With NPM (or similarly with any package manager for Node.js such as Yarn):
```
npm install kokopu
```

- Without a package manager: download the single-file package [`kokopu.zip`](https://kokopu.yo35.org/dist/kokopu.zip), unzip it,
and include either file `kokopu.js` or file `kokopu.min.js` in your HTML page.



Migrate to 3.x and 4.x
----------------------

Versions 3.0.0 and 4.0.0 introduce some breaking changes with regard to the previous versions.
To determine whether your codebase needs to be adapted or not when upgrading Kokopu,
please look at:
- [Migrate to 4.x](https://kokopu.yo35.org/docs/current/pages/migrate_to_4.html) to upgrade from 3.x to 4.0.0 (or any subsequent version).
- [Migrate to 3.x](https://kokopu.yo35.org/docs/current/pages/migrate_to_3.html) and
[Migrate to 4.x](https://kokopu.yo35.org/docs/current/pages/migrate_to_4.html) to upgrade from 1.x or 2.x to 4.0.0 (or any subsequent version).



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

// List the available moves.
const moves = position.moves();
console.log(moves.map(move => position.notation(move)));

// [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6',
// 'g5', 'h6', 'h5', 'Na6', 'Nc6', 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7',
// 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]
```

Or directly within a HTML page, if no package manager is used:

```html
<script src="kokopu.js"></script>
<script>
    const position = new kokopu.Position();
    position.play('e4');
    position.play('e5');
    // etc...
</script>
```

More examples available in [documentation](https://kokopu.yo35.org/).
