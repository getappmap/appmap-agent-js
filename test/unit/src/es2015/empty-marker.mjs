/* global APPMAP_GLOBAL_EMPTY_MARKER */

import { strict as Assert } from 'assert';
import load from '../fixture-load.mjs';

load('src/es2015/empty-marker.js');

Assert.equal(typeof APPMAP_GLOBAL_EMPTY_MARKER, 'symbol');
