import { strict as Assert } from 'assert';
import load from '../../fixture-load.mjs';

const trace = [];

global.APPMAP_GLOBAL_APPMAP_OBJECT = {
  archive(termination) {
    trace.push(termination);
  },
};

load('src/es2015/node/send/local.js');
load('src/es2015/node/setup-archive.js');

process.kill(process.pid, 'SIGINT');
process.kill(process.pid, 'SIGTERM');

Assert.deepEqual(trace, [{ type: 'SIGINT' }]);
