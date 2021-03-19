/* global APPMAP_GLOBAL_SEND */

import { strict as Assert } from 'assert';
import load from '../../../fixture-load.mjs';

load('src/es2015/node/send/local.js');

const trace = [];

global.APPMAP_GLOBAL_APPMAP_OBJECT = {
  setEngine(...args) {
    Assert.equal(this, global.APPMAP_GLOBAL_APPMAP_OBJECT);
    trace.push(['engine', ...args]);
  },
  addEvent(...args) {
    Assert.equal(this, global.APPMAP_GLOBAL_APPMAP_OBJECT);
    trace.push(['event', ...args]);
  },
  archive(...args) {
    Assert.equal(this, global.APPMAP_GLOBAL_APPMAP_OBJECT);
    trace.push(['archive', ...args]);
  },
};

APPMAP_GLOBAL_SEND({
  type: 'engine',
  name: 'engine-name',
  version: 'engine-version',
});

APPMAP_GLOBAL_SEND({
  type: 'event',
  data: 'event-data',
});

APPMAP_GLOBAL_SEND({
  type: 'archive',
  data: 'archive-data',
});

Assert.deepEqual(trace, [
  ['engine', 'engine-name', 'engine-version'],
  ['event', 'event-data'],
  ['archive', 'archive-data'],
]);
