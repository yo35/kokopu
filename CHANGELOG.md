ChangeLog
=========

2.2.0 (September 27, 2021)
--------------------------
* Add support for [Horde chess](https://en.wikipedia.org/wiki/Dunsany%27s_chess#Horde_chess).

2.1.0 (September 19, 2021)
--------------------------
* Introduce `Game#dateAsString()`.

2.0.0 (September 12, 2021)
--------------------------
* Introduce `pgnWrite()`.
* Introduce `Game#ascii()`.
* Change the way castling moves are handled at Chess960 in `Position#isMoveLegal()`: from now one,
castling moves will be recognized as legal if and only if argument `to` corresponds to the origin square
of the castling rook. As a consequence, no confusion is possible anymore between castling and regular king moves,
and status `castle960` do not exist anymore among the objects that can be returned by `Position#isMoveLegal()`.
This change affects only Chess960; regular chess and other variants are not impacted.

1.10.2 (August 15, 2021)
------------------------
* Support castling moves encoded with zeros (see #6).

1.10.1 (August 10, 2021)
------------------------
* Minor fixes in doc and packaged files.

1.10.0 (July 25, 2021)
----------------------
* Add support for [Antichess](https://en.wikipedia.org/wiki/Losing_chess).
* Clarify the expected behavior of `Position#kingSquare()` in non-standard variants, especially variants
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
* Add variants "No king" and "White/Black king only" (see #12).

1.3.1 (January 1, 2020)
-----------------------
* Add some tutorials (see #10).

1.3.0 (December 20, 2019)
-------------------------
* Improve PGN parsing robustness to linebreak issues (see #11).
* Introduce `Variations#nodes()` (see #9). WARNING! This impacts the lifecycle of the `Node` objects returned by `Node#next()` and
`Node#play(..)`: now, these functions always return a new instance of `Node`, instead of reusing the current one.

1.2.6 (December 15, 2019)
-------------------------
* Add some missing documentation (see #10).

1.2.5 (June 8, 2019)
--------------------
* Fix PGN parsing in presence of byte order mark (see #7).
* Fix parsing of comment tags spanning on more than one line (see #8).

1.2.4 (April 21, 2019)
----------------------
* Fix disambiguation issue (see #5).

1.2.3 (April 20, 2019)
----------------------
* Fix parsing of lichess syntax for %csl/%cal (see #4).

1.2.2 (March 23, 2019)
----------------------
* Fix parsing for games having a variant tag set to "Standard" (see #3).

1.2.1 (March 10, 2019)
----------------------
* Fix invalid move notation issue (see #2).

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
* Fix invalid move notation issue (see #1).

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
