/* global APPMAP_GLOBAL_EMPTY_MARKER */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/empty-marker.js');

Assert.equal(typeof APPMAP_GLOBAL_EMPTY_MARKER, 'symbol');
