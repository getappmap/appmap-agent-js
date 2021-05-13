import { main } from '../../../../lib/server/main.mjs';

main();

// import { strict as Assert } from 'assert';
// import * as FileSystem from 'fs';
// import {main} from '../../../../lib/server/main.mjs';
// Error.stackTraceLimit = Infinity;
//
// FileSystem.writeFileSync(
//   'tmp/test/rc.json',
//   JSON.stringify({
//     output: 'alongside',
//     packages: ['.'],
//   }),
//   'utf8',
// );
//
// FileSystem.writeFileSync(
//   'tmp/test/main.js',
//   `
//     exports.foo = () => "foo";
//     ((function f () {}) ());
//   `,
//   'utf8',
// );
//
// FileSystem.writeFileSync(
//   'tmp/test/test.js',
//   `
//     const Tap = require('tap');
//     const Main = require("./main.js");
//     Tap.equal(Main.foo(), "foo");
//   `,
//   'utf8',
// );
//
// const iterator = [
//   [
//     'foobar',
//     {},
//     ['node', 'tmp/test/main.js'],
//     (error) => {
//       Assert.notEqual(error, null);
//       Assert.ok(error.message.startsWith('Invalid method'));
//     },
//   ],
//   [
//     'spawn',
//     { port: -1 },
//     ['node', 'tmp/test/main.js'],
//     (error) => {
//       Assert.notEqual(error, null);
//       Assert.ok(error.message.startsWith('invalid options'));
//     },
//   ],
//   [
//     'spawn',
//     {},
//     [],
//     (error) => {
//       Assert.notEqual(error, null);
//       Assert.ok(error.message.startsWith('Empty command'));
//     },
//   ],
//   [
//     'spawn',
//     { protocol: 'inline', port: 1234 },
//     ['node', 'tmp/test/main.js'],
//     (error) => {
//       Assert.equal(error, null);
//     },
//   ],
//   [
//     'spawn',
//     { protocol: 'messaging' },
//     ['node', 'tmp/test/main.js'],
//     (error) => {
//       Assert.equal(error, null);
//     },
//   ],
//   // [
//   //   'spawn',
//   //   { protocol: 'messaging', "hook-esm": false, "hook-cjs": true, 'hook-child-process': true },
//   //   ['node', 'node_modules/tap/bin/run.js', 'tmp/test/test.js'],
//   //   (error) => {
//   //     Assert.equal(error, null);
//   //   },
//   // ]
// ][Symbol.iterator]();
//
// const step = () => {
//   const { done, value } = iterator.next();
//   if (done) {
//     process.stdout.write('done\n');
//   } else {
//     const [method, options, command, callback] = value;
//     try {
//       FileSystem.unlinkSync('tmp/test/foo.appmap.json');
//     } catch (error) {
//       Assert.equal(error.code, 'ENOENT');
//     }
//     main(
//       method,
//       {
//         'rc-file': 'tmp/test/rc.json',
//         ...options,
//       },
//       command,
//       (error, server, client) => {
//         if (error !== null) {
//           callback(error);
//           step();
//         } else {
//           client.on('exit', (code, signal) => {
//             Assert.equal(signal, null);
//             Assert.equal(code, 0);
//             // const appmap = JSON.parse(
//             //   FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
//             // );
//             // Assert.ok(Array.isArray(appmap.events));
//             // Assert.ok(appmap.events.length > 0);
//             callback(null);
//             step();
//           });
//         }
//       },
//     );
//   }
// };
//
// step();
