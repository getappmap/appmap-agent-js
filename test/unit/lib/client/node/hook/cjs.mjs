import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import * as Module from 'module';
import * as Path from 'path';
import { hookCJS } from '../../../../../../lib/client/node/hook/cjs.js';

const path = Path.resolve('tmp/test/hook-cjs.js');
const content = 'exports.foo = "bar";';
FileSystem.writeFileSync(path, content, 'utf8');

const require = Module.createRequire(import.meta.url);

delete require.cache[path];
Assert.equal(require(path).foo, 'bar');

const unhook = hookCJS((...args) => {
  Assert.deepEqual(args, ['script', path, content, null]);
  return 'exports.foo = "qux";';
});

delete require.cache[path];
Assert.equal(require(path).foo, 'qux');

unhook();

delete require.cache[path];
Assert.equal(require(path).foo, 'bar');
