import { strict as Assert } from 'assert';
import load from '../../fixture-load.mjs';

const trace = [];

global.APPMAP_GLOBAL_APPMAP_OBJECT = {
  setEngine(name, version) {
    trace.push([name, version]);
  },
};

load('src/es2015/node/send/local.js');
load('src/es2015/node/setup-engine.js');

Assert.deepEqual(trace, [['node', process.version]]);
