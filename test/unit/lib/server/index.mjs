import { strict as Assert } from 'assert';
import { Server } from 'net';
import {
  createServer,
  hookSpawnOptions,
} from '../../../../lib/server/index.mjs';

Assert.ok(createServer('messaging', {}, {}) instanceof Server);

Assert.deepEqual(
  hookSpawnOptions(
    {
      env: {
        FOO: 'BAR',
        APPMAP_FOO: 'APPMAP_BAR',
      },
      execArgv: ['foo', 'bar'],
    },
    {
      protocol: 'http3',
      port: 1234,
      esm: false,
      cjs: false,
    },
  ),
  {
    env: {
      FOO: 'BAR',
      APPMAP_PROTOCOL: 'http3',
      APPMAP_HOST: 'localhost',
      APPMAP_PORT: '1234',
    },
    execArgv: ['foo', 'bar'],
  },
);

Assert.deepEqual(
  hookSpawnOptions(
    {
      env: {},
      execArgv: [],
    },
    {
      ecma: 'es5',
      port: 'tmp/unix-socket.sock',
      esm: false,
      cjs: false,
    },
  ),
  {
    env: {
      APPMAP_PROTOCOL: 'messaging',
      APPMAP_HOST: 'localhost',
      APPMAP_PORT: 'tmp/unix-socket.sock',
    },
    execArgv: [],
  },
);

[true, false].forEach((esm) => {
  [true, false].forEach((cjs) => {
    hookSpawnOptions({}, { esm, cjs });
  });
});
