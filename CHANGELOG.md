ChangeLog
=========

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
* Add support for [Chess 960](https://en.wikipedia.org/wiki/Chess960) (aka. Fischer Random Chess).

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
