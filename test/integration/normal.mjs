// import * as Path from 'path';
import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { main } from '../../lib/server/main.mjs';

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify(
    {
      output: {
        directory: '.',
        'file-name': 'foo',
      },
      enabled: true,
      packages: [
        {
          path: '.',
        },
      ],
      childeren: [
        {
          type: 'fork',
          recorder: 'normal',
          main: 'main.mjs',
          options: {
            stdio: 'inherit',
          },
        },
      ],
    },
    null,
    2,
  ),
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/main.mjs',
  `
    import "./script1.js";
    (function main () {} ());
  `,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/script1.js',
  `
    require("./script2.js");
    (function script1 () {} ());
  `,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/script2.js',
  `
    (function script2 () {} ());
  `,
  'utf8',
);

(async () => {
  for (let protocol of ['messaging', 'http1', 'http2', 'inline']) {
    try {
      FileSystem.unlinkSync('tmp/test/foo.appmap.json');
    } catch (error) {
      Assert.equal(error.code, 'ENOENT');
    }
    Assert.equal(
      (
        await main(process.cwd(), process.stdout, {
          extends: 'tmp/test/appmap.json',
          protocol,
          _: [],
        })
      ).fromRight(),
      0,
    );
    // console.log(FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'));
  }
})();
//
//
// const iterator = ['inline', 'messaging', 'http1', 'http2'][Symbol.iterator]();
//
// const checkAppmap = () => {
//   const appmap = JSON.parse(
//     FileSystem.readFileSync('tmp/test/module.mjs.appmap.json', 'utf8'),
//   );
//   Assert.deepEqual(
//     appmap.classMap.map(({ type, name }) => ({ type, name })),
//     [
//       {
//         type: 'package',
//         name: Path.resolve('tmp/test/module.mjs'),
//       },
//       {
//         type: 'package',
//         name: Path.resolve('tmp/test/script1.js'),
//       },
//       {
//         type: 'package',
//         name: Path.resolve('tmp/test/script2.js'),
//       },
//     ],
//   );
// };
//
// const step = () => {
//   const { done, value } = iterator.next();
//   if (done) {
//     process.stdout.write('DONE\n');
//   } else {
//     try {
//       FileSystem.unlinkSync('tmp/test/module.mjs.appmap.json');
//     } catch (error) {
//       Assert.equal(error.code, 'ENOENT');
//     }
//     main(
//       'spawn',
//       {
//         'rc-file': 'tmp/test/appmap.json',
//         protocol: value,
//       },
//       ['node', 'tmp/test/module.mjs'],
//       (error, server, client) => {
//         if (error) {
//           throw error;
//         }
//         client.on('exit', (exit, signal) => {
//           Assert.equal(signal, null);
//           Assert.equal(exit, 0);
//         });
//         if (server === null) {
//           client.on('exit', (exit, signal) => {
//             checkAppmap();
//             step();
//           });
//         } else {
//           server.on('close', () => {
//             checkAppmap();
//             step();
//           });
//         }
//       },
//     );
//   }
// };
//
// step();
