#!/usr/bin/env node

import minimist from 'minimist';
import * as Agent from '../lib/server/index.mjs';

const argv = {
  protocol: 'messaging',
  port: 0,
  esm: true,
  cjs: true,
  _: null,
  ...minimist(process.argv.slice(2)),
};

const { env } = process;

const fork = (port) =>
  Agent.fork(
    argv._[0],
    argv._.slice(1),
    {
      stdio: 'inherit',
    },
    {
      ...argv,
      port: null,
    },
  );

if (argv.protocol === 'inline') {
  fork(null);
} else {
  const server = Agent.createServer(argv.protocol, env, null);
  server.listen(argv.port);
  server.on('listening', () => {
    fork(server.address().port);
  });
}
