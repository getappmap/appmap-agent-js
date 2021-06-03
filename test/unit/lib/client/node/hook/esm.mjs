import { strict as Assert } from 'assert';
import * as Path from 'path';
import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';

const preload = Path.resolve('lib/client/node/hook/esm.js');
const main = Path.resolve('tmp/test/main.mjs');
const path1 = Path.resolve('tmp/test/module1.mjs');
const path2 = Path.resolve('tmp/test/module2.mjs');
const path3 = Path.resolve('tmp/test/module3.mjs');

FileSystem.writeFileSync(
  main,
  `
    import {strict as Assert} from 'assert';
    import {hookESM, transformSource} from '${preload}';
    ((async () => {
      Assert.equal((await import('${path1}')).foo, 'bar');
      const unhook = hookESM((...args) => {
        Assert.deepEqual(args, ['${path2}', \`export const foo = 'bar';\`]);
        return Promise.resolve('export const foo = "qux";');
      });
      Assert.equal((await import('${path2}')).foo, 'qux');
      unhook();
      Assert.equal((await import('${path3}')).foo, 'bar');
    }) ());
  `,
  'utf8',
);

[path1, path2, path3].forEach((path) => {
  FileSystem.writeFileSync(path, `export const foo = 'bar';`, 'utf8');
});

ChildProcess.fork(main, [], {
  execArgv: [...process.execArgv, '--experimental-loader', preload],
  stdio: 'inherit',
}).on('exit', (code, signal) => {
  Assert.equal(signal, null);
  Assert.equal(code, 0);
});
