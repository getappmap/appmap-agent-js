
import { strict as Assert } from 'assert';
import { EventEmitter } from 'events';
import {main} from '../../../../../../../lib/client/es2015/node14x/recorder/normal-main.js';

['0', 'foo'].forEach((port) => {

  const emitter = new EventEmitter();
  const trace = [];

  const data = {
    env: {
      APPMAP_PROTOCOL: {
        requestSync: (json) => {
          trace.push(json);
          if (json.action === 'initialize') {
            return { enabled:true, session: 'session', namespace: `__HIDDEN_${port}__` };
          }
          return null;
        },
        requestAsync: () => {
          Assert.fail();
        },
      },
      APPMAP_HOST: 'localhost',
      APPMAP_PORT: port,
      APPMAP_HOOK_CJS: 'false',
      APPMAP_HOOK_ESM: 'false',
      APPMAP_APP_NAME: 'app-name'
    },
    execPath: 'exec-path',
    pid: 'pid',
    ppid: 'ppid',
    execArgv: ['exec-arg0'],
    argv: ['node', 'main.js', 'arg0'],
    platform: 'platform',
    arch: 'arch',
    version: 'version',
  }

  Object.assign(emitter, data, {cwd: () => "/cwd"});

  main(emitter);

  emitter.emit("exit", "code", "signal");

  Assert.deepEqual(
    trace,
    [
    {
      action: 'initialize',
      process: {
        ... data,
        cwd: '/cwd'
      },
      navigator: null,
      configuration: { data: {__proto__: null, 'app-name': 'app-name'}, path: '/cwd' }
    },
    { action: 'start', session: 'session', configuration: {data:{}, path:null} },
    {
      action: 'terminate',
      session: 'session',
      reason: { type: 'exit', code: 'code', signal: 'signal' }
    }
  ]
  );

});
