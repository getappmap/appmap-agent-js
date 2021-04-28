#!/usr/bin/env node

import minimist from 'minimist';
import main from '../lib/server/main.mjs';

let argv = process.argv();

let method = 'spawn';
if (process.argv[2][0] !== '-') {
  [, , method] = argv;
  argv = argv.slice(3);
} else {
  argv = argv.slice(2);
}
const { _: command, ...options } = minimist(process.argv.slice(3));
main(method, options, command, (error, server, client) => {
  if (error !== null) {
    process.stdout.write(`${error.message}${'\n'}`);
  } else {
    if (server !== null) {
      server.on('error', (error) => {
        process.stderr.write(`Server error: ${error.message}${'\n'}`);
        process.exit(1);
      });
    }
    client.on('error', (error) => {
      process.stderr.write(`Child process error: ${error.message}${'\n'}`);
      process.exit(1);
    });
    client.on('exit', (code, signal) => {
      if (signal === null) {
        process.stdout.write(
          `Child process exit with code ${String(code)}${'\n'}`,
        );
      } else {
        process.stdout.write(`Child process killed with ${signal}${'\n'}`);
      }
    });
  }
});
