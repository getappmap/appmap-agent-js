// import * as FileSystem from 'fs';
// import * as ChildProcess from 'child_process';
// import * as Agent from '../../lib/server/index.mjs';
//
// const main = 'tmp/test/main.js';
// FileSystem.writeFileSync(main, `exports.foo = () => "bar";`, 'utf8');
//
// const test = 'tmp/test/test.js';
// FileSystem.writeFileSync(
//   test,
//   `
//     const tap = require('tap');
//     const main = require("./main.js");
//     tap.equal(main.foo(), "bar");
//   `,
//   'utf8',
// );
//
// const conf = 'tmp/test/conf.json';
// FileSystem.writeFileSync(
//   conf,
//   JSON.stringify({
//     enabled: true,
//     packages: [
//       {
//         path: 'main.js',
//       },
//     ],
//   }),
//   'utf8',
// );
//
// ChildProcess.spawn(
//   'node',
//   [
//     'bin/index.mjs',
//     `--rcfile=${conf}`,
//     '--protocol=messaging',
//     '--port=0',
//     '--cjs',
//     '--esm',
//     '--hook-child-process',
//     '--',
//     'node',
//     'node_modules/tap/bin/run.js',
//     test,
//   ],
//   {
//     stdio: 'inherit',
//   },
// );
