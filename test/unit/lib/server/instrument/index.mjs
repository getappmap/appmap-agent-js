import { strict as Assert } from 'assert';
import { File } from '../../../../../lib/server/appmap/file.mjs';
import { instrument } from '../../../../../lib/server/instrument/index.mjs';

const test = (code) =>
  instrument({
    file: new File(2020, 'script', 'filename.js', code),
    session: '$',
    exclude: new Set(),
    source: false,
    counters: {
      object: 0,
      arrow: 0,
      function: 0,
      class: 0,
    },
  });

Assert.deepEqual(test('123;').fromRight(), {
  content: `123;`,
  entities: [],
});

Assert.match(test('$;').fromLeft(), /^identifier collision/);
