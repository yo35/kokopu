Kokopu version 4.0.0 introduces some breaking changes with regard to the previous versions.
Those changes may require some fixes or adjustments in your codebase when upgrading Kokopu
from 3.x to 4.0.0 (or any subsequent version).

To upgrade from an older version (1.x or 2.x), follow the {@page migrate_to_3.md migration guide to 3.x} beforehand.



Game.round() (getter and setter)
--------------------------------

As of 4.0.0, the getter {@link Game.round | Game.round()} returns a positive integer instead of a string,
and similarly the corresponding setter expects a positive integer (or any string that can be converted to a positive integer).

To support multipart rounds, Kokopu 4.0.0 introduces {@link Game.subRound | Game.subRound()} and {@link Game.subSubRound | Game.subSubRound()}.
Hence, when for instance a PGN file contains a `Round` header such as `[Round "4.1.2"]`, the header is parsed such that
{@link Game.round | Game.round()} returns `4`, {@link Game.subRound | Game.subRound()} returns `1`, and
{@link Game.subSubRound | Game.subSubRound()} returns `2`.
