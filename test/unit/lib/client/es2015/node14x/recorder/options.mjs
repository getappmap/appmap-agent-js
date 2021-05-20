import { strict as Assert } from 'assert';
import { makeOptions } from '../../../../../../../lib/client/es2015/node14x/recorder/options.js';

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
      __proto__: null,
      cwd: process.cwd(),
      engine: {
        name: 'node',
        version: process.versions.node,
      },
      main: {
        path: process.argv[1],
      },
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
  }).configuration.enabled,
  true,
);

Assert.equal(
  makeOptions({
    ...process,
    env: {
      APPMAP: 'FalsE',
    },
  }).configuration.enabled,
  false,
);

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP: ' foo , bar ',
    },
  }).configuration.enabled,
  ['foo', 'bar'],
);

// output-file-name //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_OUTPUT_FILE_NAME: 'foo',
    },
  }).configuration.output['file-name'],
  'foo',
);

// output-directory //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_OUTPUT_DIRECTORY: '/foo',
    },
  }).configuration.output.directory,
  '/foo',
);

// configuration //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_CONFIGURATION: '123',
    },
  }).configuration.extends,
  123,
);

// parse-boolean //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_EVENT_PRUNING: 'TruE',
    },
  }).configuration['event-pruning'],
  true,
);

// identity //

Assert.deepEqual(
  makeOptions({
    ...process,
    env: {
      APPMAP_MAP_NAME: 'foo',
    },
  }).configuration['map-name'],
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
