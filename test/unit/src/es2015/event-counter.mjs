/* global APPMAP_GLOBAL_EVENT_COUNTER */

import { strict as Assert } from 'assert';
import load from '../fixture-load.mjs';

load('src/es2015/event-counter.js');

Assert.equal(typeof APPMAP_GLOBAL_EVENT_COUNTER, 'number');
