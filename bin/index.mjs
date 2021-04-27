#!/usr/bin/env node

import minimist from 'minimist';
import main from '../lib/server/main.mjs';

// appmap node  <agent-options> -- node main.js
// appmap tap   <agent-options> -- [npx] tap test/**/*.js

if (process.argv.length < 2) {
  process.stderr.write(
    `Missing method positional argument, usage: appmap <method> <options> -- <command>`,
  );
} else {
  const method = process.argv[2];
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
}
