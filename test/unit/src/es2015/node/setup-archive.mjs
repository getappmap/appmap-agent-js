import { strict as Assert } from 'assert';
import load from '../../fixture-load.mjs';

const trace = [];

global.APPMAP_GLOBAL_APPMAP_OBJECT = {
  archive(termination) {
    trace.push(termination);
  },
};

load('src/es2015/node/send/local.js');
load('src/es2015/empty-marker.js');
load('src/es2015/serialize.js');
load('src/es2015/node/setup-archive.js');

process.kill(process.pid, 'SIGINT');
process.kill(process.pid, 'SIGTERM');

setTimeout(() => {
  Assert.deepEqual(trace, [{ type: 'SIGINT' }]);
}, 500);
