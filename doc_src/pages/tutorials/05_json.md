A {@link Game} object can be serialized to JSON using method {@link Game.pojo}, while the corresponding de-serialization operation
is achieved by method {@link Game.fromPOJO}.

An example of JSON de-serialization from file [`example.json`](media://example.json) is presented below:

```
const { Game } = require('kokopu');
const fs = require('fs');

// Read the content of the JSON file provided above
const jsonText = fs.readFileSync('example.json', 'utf8');

// De-serialize this content.
const game = Game.fromPOJO(JSON.parse(jsonText));

// Display an ASCII-art representation of the game.
console.log(game.ascii());

// Event: 1st American Chess Congress (4.6)
// Site: New York, NY USA
// Date: November 3, 1857
// White: Paulsen, Louis
// Black: Morphy, Paul
// 1.e4
// 1...e5
// 2.Nf3
// 2...Nc6
// 3.Nc3
// 3...Nf6
// 4.Bb5
// 4...Bc5
// 5.O-O
// 5...O-O
// 6.Nxe5
// 6...Re8
// 7.Nxc6
// 7...dxc6
// 8.Bc4
// 8...b5
// 9.Be2
// 9...Nxe4
// 10.Nxe4
// 10...Rxe4
// 11.Bf3
// 11...Re6
// 12.c3
// 12...Qd3
// 13.b4
// 13...Bb6
// 14.a4
// 14...bxa4
// 15.Qxa4
// 15...Bd7
// 16.Ra2
// 16...Rae8
// 17.Qa6 Morphy took twelve minutes over his next move, probably to assure himself that the combination was sound and that he had a forced win in every variation.
// 17...Qxf3 !!
// 18.gxf3
// 18...Rg6+
// 19.Kh1
// 19...Bh3
// 20.Rd1
//  |
//  +- Not
//  |  20.Rg1
//  |  20...Rxg1+
//  |  21.Kxg1
//  |  21...Re1+ −+
//  |
// 20...Bg2+
// 21.Kg1
// 21...Bxf3+
// 22.Kf1
// 22...Bg2+
//  |
//  +- 22...Rg2 ! would have won more quickly. For instance:
//  |  23.Qd3
//  |  23...Rxf2+
//  |  24.Kg1
//  |  24...Rg2+
//  |  25.Kh1
//  |  25...Rg1#
//  |
// 23.Kg1
// 23...Bh3+
// 24.Kh1
// 24...Bxf2
// 25.Qf1 Absolutely forced.
// 25...Bxf1
// 26.Rxf1
// 26...Re2
// 27.Ra1
// 27...Rh6
// 28.d4
// 28...Be3
// 0-1
```

The reverse JSON serialization operation is achieved similarly:

```
const game = /* initialized as above */;

// Display the JSON representing the game.
console.log(JSON.stringify(game.pojo()));

// {"white":{"name":"Paulsen, Louis"},"black":{"name":"Morphy, Paul"},"event":"1st American Chess Congress",
// "round":4,"subRound":6,"date":"1857-11-03","site":"New York, NY USA","result":"0-1","mainVariation":["e4",
// "e5","Nf3","Nc6","Nc3","Nf6","Bb5","Bc5","O-O","O-O","Nxe5" etc...
```
