import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import main from '../../../../lib/server/inline-main.mjs';

// const counter = 0;

// const onError = (error) => {
//   console.log(error.message);
//   // counter += 1;
// };

const path = 'tmp/test/foo.js';

FileSystem.writeFileSync(path, '({});', 'utf8');

FileSystem.writeFileSync('tmp/test/native.mjs', '({});');

main({
  _: [path],
});

main({
  cjs: true,
  channel: 'APPMAP_CHANNEL',
  _: [path],
});

main({
  esm: true,
  _: [path],
});
//
// main({
//   cjs: true,
//   esm: true,
//   _: [path],
// });
