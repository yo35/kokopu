ChangeLog
=========

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
