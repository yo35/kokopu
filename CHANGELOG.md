ChangeLog
=========

4.12.1 (June 22, 2025)
----------------------
* Minor fixes in documentation.

4.12.0 (April 6, 2025)
----------------------
* Add options for `Position.ascii()`: flip / coordinates / prefix (based on [#49](https://github.com/yo35/kokopu/pull/49)).

4.11.3 (January 1, 2025)
------------------------
* Minor fixes.

4.11.2 (July 13, 2024)
----------------------
* Fix broken links in documentation.

4.11.1 (July 7, 2024)
---------------------
* Upgrade and rework documentation generator (TypeDoc).

4.11.0 (June 1, 2024)
---------------------
* Make PGN parsing tolerant to missing end-of-game token at the very end of the PGN string (see [#46](https://github.com/yo35/kokopu/issues/46)).

4.10.0 (March 9, 2024)
----------------------
* Add support for NAGs $20 and $21.

4.9.2 (March 3, 2024)
---------------------
* Minor fixes.

4.9.1 (February 25, 2024)
-------------------------
* Fix inconsistent object returned by `Game.findById()` for ID aliases.

4.9.0 (February 25, 2024)
-------------------------
* Make `Game.findById()` work with ID aliases (e.g. `'end'` to indicate the last node in the main variation).

4.8.1 (January 20, 2024)
------------------------
* Compile TypeScript to ES2020 (except for standalone lib).
* Minor fixes in code and dependencies.

4.8.0 (September 5, 2023)
-------------------------
* Add method `Node.fiftyMoveClock()` to retrieve the number of half-moves since the last pawn move or capture.
* Add method `Node.fen()` to retrieve the FEN representation of the position on a game node, with the FEN counters (fifty-move clock and full-move number)
set according to the move history of the game (see [#43](https://github.com/yo35/kokopu/issues/43)). Add similarly methods `Game.initialFEN()`
and `Game.finalFEN()` to retrieve the FEN representations of the initial and final position of a game.

4.7.0 (May 25, 2023)
--------------------
* Add methods `AbstractNode.clearNags()` and `AbstractNode.filterNags(..)` to remove all the NAGs from a node or variation, or to keep only a subset of them.
* Add methods `AbstractNode.clearTags()` and `AbstractNode.filterTags(..)` to achieve similar operations on the key-value tag pairs of a node or variation.

4.6.2 (April 21, 2023)
----------------------
* Fix tag formatting in comments written by `pgnWrite(..)`.

4.6.1 (April 10, 2023)
----------------------
* Fix parsing of multi-part text comments (see [#40](https://github.com/yo35/kokopu/issues/40)).

4.6.0 (April 9, 2023)
---------------------
* Add support for NAG $44.

4.5.0 (March 18, 2023)
----------------------
* Add support for NAG $9 (see [#38](https://github.com/yo35/kokopu/issues/38)).

4.4.0 (February 19, 2023)
-------------------------
* Add support for the `for...of` syntax to iterate over all the games of a `Database` with method `Database.games()`
(see [#36](https://github.com/yo35/kokopu/issues/36)).

4.3.0 (February 3, 2023)
------------------------
* Introduce predicates `isColor(..)`, `isSquare(..)`, `isColoredPiece(..)`, etc...
* Introduce type `SquareCouple` to represent an ordered pair of squares, or a displacement on a chessboard.

4.2.1 (January 31, 2023)
------------------------
* Continuous integration with GitHub Actions instead of Travis-CI.

4.2.0 (January 24, 2023)
------------------------
* Introduce `Game.finalPosition()` and `Variation.finalPosition()` to retrieve the position at the end of a game or sub-variation.

4.1.0 (January 20, 2023)
------------------------
* Introduce `Node.removePrecedingMoves()` to erase the beginning of a game up to a given move.

4.0.1 (January 4, 2023)
-----------------------
* Introduce `Game.fullRound()` to get a human-readable string representation of the round, sub-round and sub-sub-round all together.

4.0.0 (January 4, 2023)
-----------------------
* Introduce `Game.initialFullMoveNumber()` and `Game.clearHeaders()`.
* Introduce `Game.pojo()` and `Game.fromPOJO()` to convert back and forth between a `Game` instance
and its corresponding [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object) representation,
hence allowing JSON serialization/de-serialization of a `Game` instance, deep cloning, etc...
* Breaking changes affecting `Game.round()`: look at the [migration guide](https://kokopu.yo35.org/docs/current/pages/migrate_to_4.html)
for more details.

3.3.0 (October 12, 2022)
------------------------
* Introduce `Position.isDead()` to detect positions in which the remaining material is not sufficient for any player to checkmate its opponent
(aka. [dead positions](https://en.wikipedia.org/wiki/Rules_of_chess#Dead_position)).

3.2.0 (October 9, 2022)
-----------------------
* Add support for PGN tag `ECO` (opening code in the [Encyclopaedia of Chess Openings](https://en.wikipedia.org/wiki/List_of_chess_openings) classification).
* Add support for PGN tags `Opening`, `Variation`, and `SubVariation` (description of the opening).
* Add support for PGN tag `Termination` (description of the reason for the conclusion of the game).
* Add an option to write the `PlyCount` tags (number of half-moves of the game) in the PGN generated by `pgnWrite(..)`.

3.1.0 (September 12, 2022)
--------------------------
* Introduce effective castling (see [#32](https://github.com/yo35/kokopu/issues/32)) and effective en-passant
(see [#31](https://github.com/yo35/kokopu/issues/31)), in order to make parsing of FEN strings with unreliable castling and/or
en-passant flags easier, and to ensure that `Position.isEqual(..)` do work as expected even in case of move order transposition
(see discussion in [#27](https://github.com/yo35/kokopu/issues/27)).

3.0.0 (August 26, 2022)
-----------------------
* Migration to TypeScript.
* Breaking changes affecting ES6 default imports, and methods `Game.date()` and `Game.playerElo()`:
look at the [migration guide](https://kokopu.yo35.org/docs/current/pages/migrate_to_3.html) for more details.

2.9.2 (July 14, 2022)
---------------------
* Fix PGN parsing issues regarding move number 0 and degenerated backslash followed by a linebreak
(see [#30](https://github.com/yo35/kokopu/issues/30)).

2.9.1 (July 1, 2022)
--------------------
* Fix castling move validation at Chess960 (see [#29](https://github.com/yo35/kokopu/issues/29)).

2.9.0 (June 21, 2022)
---------------------
* Introduce `Node.isVariation()` and `Variation.isVariation()` to discriminate between `Node` and `Variation` instances.
* Add support for NAGs `RR` and `N` in `pgnRead(..)`.
* Fix behavior of `pgnRead(..)` when invoked with no game index: now, the function is guaranteed to not throw `InvalidPGN`
(thus it always returns a `Database` object).
* Improve formatting of the PGN generated by `pgnWrite(..)`.
* Change the heuristic used by `pgnRead(..)` to decide whether a variation comment is a long or a short comment:
from now on, a variation comment is considered as "long" if and only if it is *followed* by a blank line in the PGN
(instead of *preceded*, as it used to be). No change regarding how node comments are processed.

2.8.1 (June 16, 2022)
---------------------
* Fix update procedure for en-passant flag in `Position.play(..)` (see [#27](https://github.com/yo35/kokopu/issues/27)).

2.8.0 (May 18, 2022)
--------------------
* Add support for NAGs $141, $143 and RR.
* Remove dependency with security issue.

2.7.0 (April 21, 2022)
----------------------
* Introduce `Game.nodes(..)` to retrieve all the moves of a game (optionally with those coming from the sub-variations).
* Introduce `Position.isEqual(..)` to check whether two instances of `Position` are identical or not.

2.6.0 (April 6, 2022)
---------------------
* Add methods to move backward in the move tree: `Node.previous()`, `Node.parentVariation()` and `Variation.parentNode()`.
* Introduce `nagSymbol(..)` to retrieve the human-readable symbols associated to each
[NAG](https://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs).

2.5.0 (March 31, 2022)
----------------------
* Introduce `Node.id()`, `Variation.id()` and `Game.findById(..)`.

2.4.1 (March 27, 2022)
----------------------
* Fix behavior of `Database#game(..)` with invalid indexes (see [#24](https://github.com/yo35/kokopu/issues/24)).

2.4.0 (March 27, 2022)
----------------------
* Expose `Database` (thus allowing for `... instanceof Database`).

2.3.0 (February 22, 2022)
-------------------------
* Enrich variation-management methods on `Game` and related objects: `Node.promoteVariation()`,
`Node.removeVariation()`, `Node.removeFollowingMoves()`... (see [#22](https://github.com/yo35/kokopu/issues/22)).

2.2.1 (January 1, 2022)
-----------------------
* Minor fixes in doc and dependencies.

2.2.0 (September 27, 2021)
--------------------------
* Add support for [Horde chess](https://en.wikipedia.org/wiki/Dunsany%27s_chess#Horde_chess).

2.1.0 (September 19, 2021)
--------------------------
* Introduce `Game.dateAsString()`.

2.0.0 (September 12, 2021)
--------------------------
* Introduce `pgnWrite()`.
* Introduce `Game.ascii()`.
* Change the way castling moves are handled at Chess960 in `Position.isMoveLegal()`: from now one,
castling moves will be recognized as legal if and only if argument `to` corresponds to the origin square
of the castling rook. As a consequence, no confusion is possible anymore between castling and regular king moves,
and status `castle960` do not exist anymore among the objects that can be returned by `Position.isMoveLegal()`.
This change affects only Chess960; regular chess and other variants are not impacted.

1.10.2 (August 15, 2021)
------------------------
* Support castling moves encoded with zeros (see [#6](https://github.com/yo35/kokopu/issues/6)).

1.10.1 (August 10, 2021)
------------------------
* Minor fixes in doc and packaged files.

1.10.0 (July 25, 2021)
----------------------
* Add support for [Antichess](https://en.wikipedia.org/wiki/Losing_chess).
* Clarify the expected behavior of `Position.kingSquare()` in non-standard variants, especially variants
in which king has no "royal power".

1.9.1 (May 30, 2021)
--------------------
* Avoid dependency on built-in module `util`.

1.9.0 (May 29, 2021)
--------------------
* Add tutorial "Set-up a game from scratch".
* Minor changes in exception messages.

1.8.0 (April 25, 2021)
----------------------
* Support syntax `'variant:FEN'` is `Position` constructor and FEN getter.
* Add code coverage.

1.7.3 (April 2, 2021)
---------------------
* Rework deployment flow.

1.7.2 (April 1, 2021)
---------------------
* Introduce `oppositeColor()`.

1.7.1 (February 21, 2021)
-------------------------
* Minor fixes in doc and packaging scripts.

1.7.0 (January 31, 2021)
------------------------
* Add UCI move parsing and generation.

1.6.1 (January 18, 2021)
------------------------
* Fix minor PGN parsing issues.

1.6.0 (January 17, 2021)
------------------------
* Report line index in PGN parsing exceptions.
* Improve parsing resiliency to PGN syntactic errors.

1.5.0 (January 10, 2021)
-----------------------
* Add figurine notation.
* More lenient chess960 variant header parsing.

1.4.0 (August 22, 2020)
-----------------------
* Add variants "No king" and "White/Black king only" (see [#12](https://github.com/yo35/kokopu/issues/12)).

1.3.1 (January 1, 2020)
-----------------------
* Add some tutorials (see [#10](https://github.com/yo35/kokopu/issues/10)).

1.3.0 (December 20, 2019)
-------------------------
* Improve PGN parsing robustness to linebreak issues (see [#11](https://github.com/yo35/kokopu/issues/11)).
* Introduce `Variations.nodes()` (see [#9](https://github.com/yo35/kokopu/issues/9)).
WARNING! This impacts the lifecycle of the `Node` objects returned by `Node.next()` and `Node.play(..)`:
now, these functions always return a new instance of `Node`, instead of reusing the current one.

1.2.6 (December 15, 2019)
-------------------------
* Add some missing documentation (see [#10](https://github.com/yo35/kokopu/issues/10)).

1.2.5 (June 8, 2019)
--------------------
* Fix PGN parsing in presence of byte order mark (see [#7](https://github.com/yo35/kokopu/issues/7)).
* Fix parsing of comment tags spanning on more than one line (see [#8](https://github.com/yo35/kokopu/issues/8)).

1.2.4 (April 21, 2019)
----------------------
* Fix disambiguation issue (see [#5](https://github.com/yo35/kokopu/issues/5)).

1.2.3 (April 20, 2019)
----------------------
* Fix parsing of lichess syntax for %csl/%cal (see [#4](https://github.com/yo35/kokopu/issues/4)).

1.2.2 (March 23, 2019)
----------------------
* Fix parsing for games having a variant tag set to "Standard" (see [#3](https://github.com/yo35/kokopu/issues/3)).

1.2.1 (March 10, 2019)
----------------------
* Fix invalid move notation issue (see [#2](https://github.com/yo35/kokopu/issues/2)).

1.2.0 (September 30, 2018)
--------------------------
* Optimization: reduce the memory footprint of object Game.
* PGN parsing is now robust to ill-formed header tags.
* Replace JSHint with ESLint.

1.1.0 (July 22, 2018)
---------------------
* Add support for [Chess960](https://en.wikipedia.org/wiki/Chess960) (aka. Fischer Random Chess).

1.0.3 (July 9, 2018)
--------------------
* Fix invalid move notation issue (see [#1](https://github.com/yo35/kokopu/issues/1)).

1.0.2 (July 7, 2018)
--------------------
* Fix URL issue.

1.0.1 (July 7, 2018)
--------------------
* Provide a browser-ready package.

1.0.0 (June 16, 2018)
---------------------
* Add and publish documentation.

0.99.5 (May 27, 2018)
---------------------
* Improve testing pipeline.
* Integration with Travis-CI.

0.99.4 (May 26, 2018)
---------------------
* Build both minified and non-minified files.

0.99.3 (May 6, 2018)
--------------------
* Fix various move descriptor issues.

0.99.2 (May 6, 2018)
--------------------
* Add changelog file.
* Fix meta-data.

0.99.0 (May 6, 2018)
--------------------
* First public version.
