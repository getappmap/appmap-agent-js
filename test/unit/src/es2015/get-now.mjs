/* global APPMAP_GLOBAL_GET_NOW */

import { strict as Assert } from 'assert';
import load from '../fixture-load.mjs';

load('src/es2015/get-now.js');

Assert.ok(typeof APPMAP_GLOBAL_GET_NOW() === 'number');
