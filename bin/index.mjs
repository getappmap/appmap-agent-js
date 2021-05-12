#!/usr/bin/env node

import minimist from 'minimist';
import { main } from '../lib/server/main.mjs';

main(process, minimist(process.argv)).then(process.exit);
