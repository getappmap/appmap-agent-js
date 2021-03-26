import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import main from '../../../lib/main.mjs';

const path = 'test/unit/env/target/target.js';

FileSystem.writeFileSync(path, `process.argv.concat(["qux"]);`, 'utf8');

Assert.deepEqual(
  main({
    _: [path, 'foo', 'bar'],
  }),
  ['node', path, 'foo', 'bar', 'qux'],
);

Assert.deepEqual(
  main({
    channel: 'foo',
  }),
  undefined,
);
