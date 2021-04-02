import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import makeChannel from '../../../../lib/server/inline.mjs';

const path = 'tmp/test/target.js';

// FileSystem.writeFileSync(path, `process.argv.concat(["qux"]);`, 'utf8');

const channel = makeChannel({
  APPMAP_OUTPUT_DIR: "tmp/appmap",
  APPMAP_GIT_DIR:
  APPMAP: "true",
  APPMAP_CONFIG: "tmp/test/appmap.yml"
});

// Assert.equal(
//   channel.instrumentScript(`123;`, `filename.js`),


channel.initialize({
  pid: 123,
  engine: "foo@bar",
  name: "main",
  prefix: "qux"
});

Assert.equal(
  channel.instrumentScript(`const  o1  =  {};`, `filename.js`),
  `const o1 = {};`);

channel.instrumentModule(`const  o2  =  {};`, `filename.mjs`, {
  resolve: (...args) => {
    Assert.deepEqual(args, [`const o2 = {};`]);
  },
  reject: () => { Assert.fail() }
});

channel.emit("event");

chanel.terminate("reason");

const json = JSON.parse(Fs.readFileSync(`tmp/appmap/main.appmap.json`, 'utf8'));

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
