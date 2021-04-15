#!/usr/bin/env node

import minimist from 'minimist';
import * as Agent from '../lib/server/index.mjs';

const argv = {
  protocol: 'messaging',
  port: 0,
  esm: true,
  cjs: true,
  ecma: 'es2015',
  _: [],
  ...minimist(process.argv.slice(2)),
};

if (argv._.length === 0) {
  process.stderr.write('Missing entry point\n');
} else {
  const env = { ...process.env };
  const fork = (port) =>
    Agent.fork(
      argv._[0],
      argv._.slice(1),
      {
        stdio: 'inherit',
        env,
      },
      {
        ...argv,
        port,
      },
    );
  if (argv.protocol === 'inline') {
    fork(null);
  } else {
    const server = Agent.createServer(argv.protocol, env, null);
    server.listen(argv.port);
    server.on('listening', () => {
      fork(server.address().port).on('exit', (code, signal) => {
        server.close();
      });
    });
  }
}
