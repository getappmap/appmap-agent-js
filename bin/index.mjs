#!/usr/bin/env node

import minimist from 'minimist';
import { main } from '../lib/server/main.mjs';

main(process.cwd(), process.stdout, minimist(process.argv.slice(2))).then(
  (either) => {
    either.either(
      (message) => {
        process.stderr.write(message);
        process.stderr.write('\n');
        process.exitCode = 1;
      },
      (code) => {
        process.exitCode = code;
      },
    );
  },
);
