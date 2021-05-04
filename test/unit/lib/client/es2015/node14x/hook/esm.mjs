import { strict as Assert } from 'assert';
import * as Path from 'path';
import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';

const preload = Path.resolve('lib/client/es2015/node14x/hook/esm.js');
const main = Path.resolve("tmp/test/main.mjs");
const path1 = Path.resolve("tmp/test/module1.mjs");
const path2 = Path.resolve("tmp/test/module2.mjs");
const path3 = Path.resolve("tmp/test/module3.mjs");

FileSystem.writeFileSync(
  main,
  `
    import {strict as Assert} from 'assert';
    import HookESM from '${preload}';
    ((async () => {
      Assert.equal((await import('${path1}')).foo, 'bar');
      HookESM.start((...args) => {
        Assert.deepEqual(args.length, 4);
        Assert.deepEqual(args.slice(0, 3), ['module', '${path2}', \`export const foo = 'bar';\`]);
        args[3].resolve('export const foo = "qux";');
      });
      Assert.throws(
        () => HookESM.start(() => { Assert.fail() }),
        /^Error: esm modules are already hooked/u
      );
      Assert.equal((await import('${path2}')).foo, 'qux');
      HookESM.stop();
      Assert.throws(
        () => HookESM.stop(),
        /^Error: esm modules are not yet hooked/u
      );
      Assert.equal((await import('${path3}')).foo, 'bar');
    }) ());
  `,
  "utf8"
);

[path1, path2, path3].forEach((path) => {
  FileSystem.writeFileSync(path, `export const foo = 'bar';`, 'utf8');
});

ChildProcess.fork(
  main,
  [],
  {
    execArgv: [
      ...process.execArgv,
      "--experimental-loader",
      preload
    ],
    stdio: "inherit"
  }
).on('exit', (code, signal) => {
  Assert.equal(signal, null);
  Assert.equal(code, 0);
});

// const PATH = `file://localhost/foo/bar.mjs`;
// const CONTENT1 = `module.exports = 123;`;
// const CONTENT2 = `export default 456;`;
// const CONTENT3 = `export default 789;`;
//
// const transformSource = hookESM((...args) => {
//   Assert.equal(args.length, 3);
//   Assert.equal(args[0], '/foo/bar.mjs');
//   Assert.equal(args[1], CONTENT1);
//   Assert.equal(typeof args[2], 'object');
//   Assert.equal(typeof args[2].resolve, 'function');
//   Assert.equal(typeof args[2].reject, 'function');
//   args[2].resolve(CONTENT2);
// });
//
// const defaultTransformSource = (...args) => {
//   Assert.equal(args.length, 3);
//   Assert.equal(args[0], CONTENT1);
//   Assert.deepEqual(args[1], { format: 'foobar', url: PATH });
//   Assert.deepEqual(args[2], defaultTransformSource);
//   return new Promise((resolve, reject) => {
//     resolve({ source: CONTENT3 });
//   });
// };
//
// transformSource(CONTENT1, { format: 'module', url: PATH }, () =>
//   Assert.fail(),
// ).then((result) => {
//   Assert.deepEqual(result, { source: CONTENT2 });
// });
//
// transformSource(
//   new TextEncoder().encode(CONTENT1),
//   { format: 'module', url: PATH },
//   () => Assert.fail(),
// ).then((result) => {
//   Assert.deepEqual(result, { source: CONTENT2 });
// });
//
// transformSource(
//   CONTENT1,
//   { format: 'foobar', url: PATH },
//   defaultTransformSource,
// ).then((result) => {
//   Assert.deepEqual(result, { source: CONTENT3 });
// });
