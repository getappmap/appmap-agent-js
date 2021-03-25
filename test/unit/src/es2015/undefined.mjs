/* global APPMAP_GLOBAL_UNDEFINED */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/undefined.js');

Assert.equal(APPMAP_GLOBAL_UNDEFINED, undefined);
