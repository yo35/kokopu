---
title: Load a PGN file
---


Load a PGN file
===============

The [Portable Game Notation](https://en.wikipedia.org/wiki/Portable_Game_Notation) is a standard plain-text file format used to describe chess games.
The format is capable to describe not only the game moves, but also all the meta-data associated to the games (name of the players,
date at which the game has been played, etc.), and move annotations (text comment, alternative variations, etc.).

An example of such PGN file is provided here: [`example.pgn`](example.pgn).

```
const { pgnRead } = require('kokopu');
const fs = require('fs');

// Read the content of the PGN file provided above.
const pgnText = fs.readFileSync('example.pgn', 'utf8');

// Parse this content.
const database = pgnRead(pgnText);

// Get the number of games in the PGN file.
database.gameCount(); // 2

// Retrieve the first game, and get information about it.
const firstGame = database.game(0);
firstGame.playerName('w'); // 'Bill Gates'
firstGame.playerName('b'); // 'Magnus Carlsen'
firstGame.date(); // 2014-01-22T23:00:00.000Z
firstGame.result(); // '0-1'

// Display the moves that compose the main variation.
const mainVariation = firstGame.mainVariation();
mainVariation.nodes().map(node => node.notation());

// [ 'e4', 'Nc6', 'Nf3', 'd5', 'Bd3', 'Nf6', 'exd5', 'Qxd5', 'Nc3', 'Qh5',
// 'O-O', 'Bg4', 'h3', 'Ne5', 'hxg4', 'Nfxg4', 'Nxe5', 'Qh2#' ]
```

Another example, that handles an annotated game, with text comments and sub-variations (more details on this topic in {@link Node} and {@link Variation}):

```
const database = /* initialized as above */;
const secondGame = database.game(1);

for (let node = secondGame.mainVariation().first(); node; node = node.next()) { // iteration over the nodes of the main variation

    // Display the move and the associated text comment, if any.
    console.log(node.notation() + (node.comment() ? ' ' + node.comment() : ''));

    // Display the alternative variations, if any.
    node.variations().forEach((variation, index) => {
        let text = '  variation ' + (index + 1) + ' ->';
        if (variation.comment()) {
            text += ' ' + variation.comment();
        }
        for (let nodeInVariation = variation.first(); nodeInVariation; nodeInVariation = nodeInVariation.next()) {
            text += ' ' + nodeInVariation.notation();
            if (nodeInVariation.comment()) {
                text += ' ' + nodeInVariation.comment();
            }
        }
        console.log(text);
    });
}

// e4
// e5
// Nf3
// Nc6
// Nc3
// Nf6
// Bb5
// Bc5
// O-O
// O-O
// Nxe5
// Re8
// Nxc6
// dxc6
// Bc4
// b5
// Be2
// Nxe4
// Nxe4
// Rxe4
// Bf3
// Re6
// c3
// Qd3
// b4
// Bb6
// a4
// bxa4
// Qxa4
// Bd7
// Ra2
// Rae8
// Qa6 Morphy took twelve minutes over his next move, probably to assure himself that the combination was sound and that he had a forced win in every variation.
// Qxf3
// gxf3
// Rg6+
// Kh1
// Bh3
// Rd1
//   variation 1 -> Not Rg1 Rxg1+ Kxg1 Re1+
// Bg2+
// Kg1
// Bxf3+
// Kf1
// Bg2+
//   variation 1 -> Rg2 would have won more quickly. For instance: Qd3 Rxf2+ Kg1 Rg2+ Kh1 Rg1#
// Kg1
// Bh3+
// Kh1
// Bxf2
// Qf1 Absolutely forced.
// Bxf1
// Rxf1
// Re2
// Ra1
// Rh6
// d4
// Be3
```
