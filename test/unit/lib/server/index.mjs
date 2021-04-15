import { strict as Assert } from 'assert';
import { Server } from 'net';
import * as FileSystem from 'fs';
import * as Agent from '../../../../lib/server/index.mjs';

const env = {
  APPMAP_FOO: 'BAR',
  QUX: 'BUZ',
};
Assert.ok(Agent.createServer('messaging', env, {}) instanceof Server);
Assert.deepEqual(env, { QUX: 'BUZ' });

Assert.deepEqual(
  Agent.hookForkOptions(
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
      APPMAP_FOO: 'APPMAP_BAR',
      APPMAP_PROTOCOL: 'http3',
      APPMAP_HOST: 'localhost',
      APPMAP_PORT: '1234',
    },
    execArgv: ['foo', 'bar'],
  },
);

Assert.deepEqual(
  Agent.hookForkOptions(
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
    Agent.hookForkOptions({}, { esm, cjs });
  });
});

{
  const path = 'tmp/test/main.js';
  const options = {
    protocol: 'inline',
    esm: false,
    cjs: false,
  };
  FileSystem.writeFileSync(path, `123;`, 'utf8');
  Agent.fork(path, [], {}, options);
  Agent.spawn('node', [path], {}, options);
  Agent.spawnSync('node', [path], {}, options);
}
