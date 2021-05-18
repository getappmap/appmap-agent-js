import { strict as Assert } from 'assert';
import { makeOptions } from '../../../../../../../lib/client/es2015/node14x/recorder/options.js';

// Assert.throws(
//   () =>
//     makeOptions({
//       APPMAP_FOO: 'TruE',
//     }),
//   /^Error: invalid appmap environment variable/,
// );

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {},
  }),
  {
    host: 'localhost',
    port: 0,
    protocol: 'inline',
    configuration: {
      data: {
        __proto__: null,
        engine: {
          name: 'node',
          version: process.versions.node,
        },
        main: {
          path: process.argv[1],
        },
      },
      path: process.cwd(),
    },
  },
);

// enabled //

Assert.equal(
  makeOptions({
    ...process,
    env: {
      APPMAP: 'TruE',
    },
  }).configuration.data.enabled,
  true,
);

Assert.equal(
  makeOptions({
    ...process,
    env: {
      APPMAP: 'FalsE',
    },
  }).configuration.data.enabled,
  false,
);

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP: ' foo , bar ',
    },
  }).configuration.data.enabled,
  ['foo', 'bar'],
);

// output-file-name //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_OUTPUT_FILE_NAME: 'foo',
    },
  }).configuration.data.output['file-name'],
  'foo',
);

// output-directory //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_OUTPUT_DIRECTORY: '/foo',
    },
  }).configuration.data.output.directory,
  '/foo',
);

// parse-boolean //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_EVENT_PRUNING: 'TruE',
    },
  }).configuration.data['event-pruning'],
  true,
);

// identity //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_MAP_NAME: 'foo',
    },
  }).configuration.data['map-name'],
  'foo',
);

// port //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_PORT: '1234',
    },
  }).port,
  1234,
);

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_PORT: 'unix-socket',
    },
  }).port,
  'unix-socket',
);
