import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import makeChannel from '../../../../lib/server/inline-channel.mjs';

const channel = makeChannel();

channel.initialize({
  env: {
    APPMAP_OUTPUT_DIR: 'tmp/appmap',
    APPMAP_MAP_NAME: 'foo',
  },
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

Assert.deepEqual(json.events, ['event']);
