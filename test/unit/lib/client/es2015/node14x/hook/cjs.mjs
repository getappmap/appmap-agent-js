import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import * as Module from 'module';
import * as Path from 'path';
import HookCJS from '../../../../../../../lib/client/es2015/node14x/hook/cjs.js';

const path = Path.resolve('tmp/test/hook-cjs.js');
const content = 'exports.foo = "bar";';
FileSystem.writeFileSync(path, content, 'utf8');

const require = Module.createRequire(import.meta.url);

delete require.cache[path];
Assert.equal(require(path).foo, 'bar');

HookCJS.start((...args) => {
  Assert.deepEqual(args, ['script', path, content, null]);
  return 'exports.foo = "qux";';
});

Assert.throws(
  () =>
    HookCJS.start(() => {
      Assert.fail();
    }),
  /^Error: cjs modules are already hooked/u,
);

delete require.cache[path];
Assert.equal(require(path).foo, 'qux');

HookCJS.stop();

Assert.throws(() => HookCJS.stop(), /^Error: cjs modules are not yet hooked/u);

delete require.cache[path];
Assert.equal(require(path).foo, 'bar');
