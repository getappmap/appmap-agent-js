/* globals prefix_GLOBAL_PROCESS_ID, prefix_GLOBAL_EMIT */

import { strict as Assert } from 'assert';
import { EventEmitter } from 'events';
import setup from '../../../../../../lib/client/es2015/node/setup.js';

const emitter = new EventEmitter();
const trace = [];
emitter.env = {
  APPMAP_PROTOCOL: {
    requestSync: (json) => {
      trace.push(['sync', json]);
      if (json.name === 'initialize') {
        return { session: 'session', prefix: 'prefix' };
      }
      return 'qux';
    },
    requestAsync: (json, pending) => {
      trace.push(['async', json]);
      if (pending !== null) {
        pending.resolve('qux');
      }
    },
  },
};

emitter.pid = 123;

emitter.version = '1.2.3';

const { instrumentScript, instrumentModule } = setup('origin', emitter);

Assert.equal(prefix_GLOBAL_PROCESS_ID, 123);

Assert.equal(instrumentScript('script.js', 'script;'), 'qux');

Assert.equal(
  instrumentModule('module.mjs', 'module;', {
    reject: () => Assert.fail(),
    resolve: (...args) => {
      Assert.deepEqual(args, ['qux']);
    },
  }),
  undefined,
);

Assert.equal(prefix_GLOBAL_EMIT('event'), undefined);

emitter.emit('exit', 'code', 'origin');

emitter.emit('SIGINT');
emitter.emit('SIGTERM');
Assert.throws(
  () => emitter.emit('uncaughtException', new Error('BOUM'), 'origin'),
  /^Error: BOUM/,
);
Assert.throws(() => emitter.emit('uncaughtException', 'BOUM', 'origin'));

Assert.deepEqual(trace, [
  [
    'sync',
    {
      name: 'initialize',
      env: {},
      init: {
        pid: emitter.pid,
        engine: `node@${emitter.version}`,
        feature: 'TODO',
        feature_group: 'TODO',
        labels: ['TODO'],
        frameworks: ['TODO'],
        recording: {
          defined_class: 'TODO',
          method_id: 'TODO',
        },
      },
    },
  ],
  [
    'sync',
    {
      name: 'instrument',
      source: 'script',
      path: 'script.js',
      content: 'script;',
      session: 'session',
    },
  ],
  [
    'async',
    {
      name: 'instrument',
      source: 'module',
      path: 'module.mjs',
      content: 'module;',
      session: 'session',
    },
  ],
  [
    'async',
    {
      name: 'emit',
      session: 'session',
      event: 'event',
    },
  ],
  [
    'sync',
    {
      name: 'terminate',
      session: 'session',
      sync: false,
      reason: {
        type: 'exit',
        code: 'code',
        origin: 'origin',
      },
    },
  ],
]);
