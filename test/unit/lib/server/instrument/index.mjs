import { strict as Assert } from 'assert';
import File from '../../../../../lib/server/file.mjs';
import instrument from '../../../../../lib/server/instrument/index.mjs';

Assert.deepEqual(
  instrument(new File(2020, 'script', 'filename.js', `123;`), {prefix:"$", exclude:new Set()}).fromRight(),
  {
    content: `123;`,
    entities: []
  }
);

Assert.match(
  instrument(new File(2020, 'script', 'filename.js', `$;`), {prefix:"$", exclude:new Set()}).fromLeft(),
  /^identifier collision/
);
