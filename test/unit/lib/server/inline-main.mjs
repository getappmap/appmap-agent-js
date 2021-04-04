import * as FileSystem from 'fs';
import main from '../../../../lib/server/inline-main.mjs';

const path = 'tmp/test/foo.js';

FileSystem.writeFileSync(path, '({});', 'utf8');

main(
  {
    _: [path],
  },
  'inherit',
);

main(
  {
    cjs: true,
    'output-dir': 'tmp/appmap',
    'app-name': 'foo',
    'map-name': 'bar',
    _: [path],
  },
  'inherit',
);

main(
  {
    esm: true,
    _: [path],
  },
  'inherit',
);

main(
  {
    foo: 'bar',
    'output-dir': 'tmp/appmap',
    'app-name': 'foo',
    'map-name': 'bar',
    cjs: true,
    esm: true,
    _: [path],
  },
  'inherit',
);
