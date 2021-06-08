#!/usr/bin/env node

import minimist from 'minimist';
import { main } from '../lib/server/main.mjs';

main(process, minimist(process.argv.slice(2))).then(
  (either) => {
    either.either(
      (message) => {
        process.stderr.write(`${message}${'\n'}`);
        process.exitCode = 123;
      },
      (code) => {
        process.exitCode = code;
      },
    );
  },
);
