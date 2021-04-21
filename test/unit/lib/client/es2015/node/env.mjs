import { strict as Assert } from 'assert';
import Env from '../../../../../../lib/client/es2015/node/env.js';

{
  const env1 = {
    FOO: 'bar',
    APPMAP_PORT: '123',
    APPMAP_HOST: 'host',
    APPMAP_HOOK_CHILD_PROCESS: 'TruE',
  };
  const env2 = { ...env1 };
  const options = Env.extractOptions(env2);
  Assert.deepEqual(options, {
    __proto__: null,
    protocol: 'inline',
    port: 123,
    host: 'host',
    'hook-child-process': true,
  });
  Assert.deepEqual(env2, { FOO: 'bar' });
  Assert.deepEqual(Env.combineOptions(env2, options), {
    __proto__: null,
    ...env1,
    APPMAP_PROTOCOL: 'inline',
    APPMAP_HOOK_CHILD_PROCESS: 'true',
  });
}

Assert.equal(Env.extractOptions({ APPMAP_PORT: 'foo' }).port, 'foo');
