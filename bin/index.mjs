#!/usr/bin/env node

import minimist from 'minimist';
import {main} from '../lib/server/main.mjs';

main(minimist(argv)).then(process.exit);
