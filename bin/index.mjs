#!/usr/bin/env node

import ChildProcess from 'child_process';
import minimist from 'minimist';
import { hookSpawnOptions, createServer } from '../lib/server/index.mjs';

const argv = {
  protocol: 'messaging',
  port: 0,
  esm: true,
  cjs: true,
  _: null,
  ...minimist(process.argv.slice(2)),
};

const { env } = process;

if (argv.protocol === 'inline') {
  ChildProcess.spawn(
    'node',
    argv._,
    hookSpawnOptions(
      {
        stdio: 'inherit',
      },
      {
        ...argv,
        port: null
      },
    ),
  ));
} else {
  const server = createServer(argv.protocol, env, null);
  server.listen(argv.port);
  server.on('listening', () => {
    ChildProcess.spawn(
      'node',
      argv._,
      hookSpawnOptions(
        {
          stdio: 'inherit',
        },
        {
          ...argv,
          port: server.address().port,
        },
      ),
    );
  });
}
