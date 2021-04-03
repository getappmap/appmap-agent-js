import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import makeChannel from '../../../../lib/server/inline.mjs';

const channel = makeChannel();

channel.initialize({
  env: {
    APPMAP_OUTPUT_DIR: 'tmp/appmap',
    APPMAP_MAP_NAME: 'foo',
  }
});

Assert.equal(
  channel.instrumentScript(`filename.js`, `const  o1  =  {};`),
  `const o1 = {};`,
);

channel.instrumentModule(`filename.mjs`, `const  o2  =  {};`, {
  resolve: (...args) => {
    Assert.deepEqual(args, [`const o2 = {};`]);
  },
  reject: () => {
    Assert.fail();
  },
});

channel.instrumentModule(`filename.mjs`, `@INVALID_JS@`, {
  resolve: (...args) => {
    Assert.fail();
  },
  reject: (...args) => {
    Assert.equal(args.length, 1);
    Assert.ok(args[0] instanceof Error);
  },
});

channel.emit('event');

channel.terminate('reason');

const json = JSON.parse(
  FileSystem.readFileSync(`tmp/appmap/foo.appmap.json`, 'utf8'),
);

Assert.deepEqual(json.events, ["event"]);

// Assert.deepEqual(
//   main({
//     _: [path, 'foo', 'bar'],
//   }),
//   ['node', path, 'foo', 'bar', 'qux'],
// );
//
// Assert.deepEqual(
//   main({
//     channel: 'foo',
//   }),
//   undefined,
// );
//
//
//
//
// import { strict as Assert } from 'assert';
// import { load } from '../../../__fixture__.mjs';
//
// load('src/es2015/node/send/local.js');
//
// const trace = [];
//
// global.APPMAP_GLOBAL_APPMAP_OBJECT = {
//   setEngine(...args) {
//     Assert.equal(this, global.APPMAP_GLOBAL_APPMAP_OBJECT);
//     trace.push(['engine', ...args]);
//   },
//   addEvent(...args) {
//     Assert.equal(this, global.APPMAP_GLOBAL_APPMAP_OBJECT);
//     trace.push(['event', ...args]);
//   },
//   archive(...args) {
//     Assert.equal(this, global.APPMAP_GLOBAL_APPMAP_OBJECT);
//     trace.push(['archive', ...args]);
//   },
// };
//
// Assert.equal(
//   APPMAP_GLOBAL_SEND('engine', {
//     name: 'engine-name',
//     version: 'engine-version',
//   }),
//   true,
// );
//
// Assert.equal(APPMAP_GLOBAL_SEND('event', 'event-data'), true);
//
// Assert.equal(APPMAP_GLOBAL_SEND('archive', 'archive-data'), true);
//
// Assert.equal(APPMAP_GLOBAL_SEND('foo', 'bar'), false);
//
// Assert.deepEqual(trace, [
//   ['engine', 'engine-name', 'engine-version'],
//   ['event', 'event-data'],
//   ['archive', 'archive-data'],
// ]);
