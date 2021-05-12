import { strict as Assert } from 'assert';
import * as Path from 'path';
import * as Module from 'module';

const require = Module.createRequire(import.meta.url);
const path1 = Path.resolve('lib/client/es2015/node14x/hook/esm.js');
const path2 = Path.resolve('lib/client/es2015/node14x/hook/index.js');

{
  const {makeHook, isHookESMEnabled} = require(path2);
  Assert.equal(isHookESMEnabled(), false);
  Assert.throws(() => { makeHook({esm:true, cjs:false}) }, /^Error: esm hook must preloaded/);
}

{
  delete require.cache[path1];
  delete require.cache[path2];
  require(path1);
  const {makeHook, isHookESMEnabled} = require(path2);
  Assert.equal(isHookESMEnabled(), true);
  const hook = makeHook({esm:true, cjs:true});
  hook.start(() => { Assert.fail() });
  hook.stop();
}
