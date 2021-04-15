import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import * as Agent from '../../lib/server/index.mjs';

ChildProcess.spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });

FileSystem.writeFileSync(
  'tmp/test/dependency.js',
  `module.exports = function dependency () {};`,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/main.mjs',
  `import dependency from "./dependency.js"; dependency();`,
  'utf8',
);

// console.log(hookSpawnOptions(
//   {
//     stdio: 'inherit',
//   },
//   {
//     protocol: "inline",
//     cjs: true,
//     esm: true
//   },
// ));

Agent.fork(
  'tmp/test/main.mjs',
  [],
  {
    stdio: 'inherit',
    env: {
      NODE_DEBUG: 'appmap*',
      APPMAP_MAP_NAME: 'inline',
      ...process.env,
    },
  },
  {
    protocol: 'inline',
    cjs: true,
    esm: true,
  },
);

//
// ChildProcess.forkSync(
//   'node',
//   ["tmp/test/main.mjs"],
//   hookForOptions(
//     {
//       stdio: 'inherit',
//     },
//     {
//       protocol: "inline",
//       cjs: true,
//       esm: true
//     },
//   ),
// );

// spawnSync(
//   'node',
//   argv._,
//   hookSpawnOptions(
//     {
//       stdio: 'inherit',
//     },
//     {
//       ...argv,
//       port: null
//     },
//   ),
// ));
//
// spawnSync("node", [
//   "bin/index.mjs",
//   "--protocol=inline",
//   "--cjs",
//   "--esm",
//   "--",
//   "tmp/test/main.mjs"
// ], {
//   stdio: "inherit",
//   env: {
//     APPMAP_OUTPUT_DIR: "tmp/appmap",
//     APPMAP_NAME: "inline"
//   }
// });
