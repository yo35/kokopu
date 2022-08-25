Kokopu version 3.0.0 introduces some breaking changes with regard to the previous versions.
Those changes may require some fixes or adjustments in your codebase when upgrading Kokopu
from 1.x or 2.x to 3.0.0 (or any subsequent version).



ES6 default imports
-------------------

Importing Kokopu using ES6 default imports (i.e. `import kokopu from 'kokopu';`)
does not work as of 3.0.0. Those imports must be converted to named imports,
and the references to Kokopu's symbols in the codebase must be fixed.

For instance, the following piece of code:

```
import kokopu from 'kokopu';
const p = new kokopu.Position();
const db = kokopu.pgnRead( /* some PGN string */ );
```

... must be changed into:

```
import { Position, pgnRead } from 'kokopu';
const p = new Position();
const db = pgnRead( /* some PGN string */ );
```

On the other hand, if your codebase uses CommonJS imports (i.e. `const kokopu = require('kokopu');`
or `const { Position, pgnRead } = require('kokopu');`), no change is required.



Game.date() (getter)
--------------------

As of 3.0.0, {@link Game.date | Game.date()} returns a {@link DateValue} object, instead of different types of objects
depending on whether the month and day of month is defined or not, as it used to be the case in previous versions.

Check the methods of {@link DateValue} (in particular {@link DateValue.type | DateValue.type()}) to determine
how to adapt your codebase. {@link Game.dateAsDate | Game.dateAsDate()} can also be considered as an alternative,
altought this method does not match the behavior of the legacy Game.date() method when the date of the game
is partially defined (i.e. when the month and/or the day of month are undefined).

However, please note that the behavior of {@link Game.dateAsString | Game.dateAsString()} remains unchanged.



Game.date() (setter)
--------------------

The behavior of the {@link Game.date | Game.date()} setter has changed in 3.0.0 to take into account the modification
of the corresponding getter. Consequences on the existing codebase are illustrated on the examples below.

- No modification required:

```
game.date( anotherGame.date() ); // Copying the date field from another Game instance.
game.date( undefined ); // Erasing the date field with undefined.
game.date( Date.now() ); // Setting a JavaScript Date object.
```

- Those examples no longer work in 3.0.0:

```
game.date({ year: 2022, month: 8 }); // (1) Setting a partial date, without the day of month.
game.date({ year: 2022 }); // (2) Setting a partial date, with the year only.
```

... and must be changed into:

```
game.date(2022, 8); // (1)
game.date(2022); // (2)
```
