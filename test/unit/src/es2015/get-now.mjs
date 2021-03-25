/* global APPMAP_GLOBAL_GET_NOW */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/get-now.js');

Assert.equal(typeof APPMAP_GLOBAL_GET_NOW(), 'number');
