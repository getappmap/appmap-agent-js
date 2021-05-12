import { strict as Assert } from 'assert';
import { File } from '../../../../../lib/server/appmap/file.mjs';
import { instrument } from '../../../../../lib/server/instrument/index.mjs';

Assert.deepEqual(
  instrument(new File(2020, 'script', 'filename.js', `123;`), {
    session: '$',
    exclude: new Set(),
  }).fromRight(),
  {
    content: `123;`,
    entities: [],
  },
);

Assert.match(
  instrument(new File(2020, 'script', 'filename.js', `$;`), {
    session: '$',
    exclude: new Set(),
  }).fromLeft(),
  /^identifier collision/,
);
