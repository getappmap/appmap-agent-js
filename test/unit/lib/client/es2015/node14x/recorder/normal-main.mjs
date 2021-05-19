import { strict as Assert } from 'assert';
import { EventEmitter } from 'events';
import { main } from '../../../../../../../lib/client/es2015/node14x/recorder/normal-main.js';

const emitter = new EventEmitter();
const trace = [];

emitter.env = {
  APPMAP_PROTOCOL: {
    request: (json) => {
      trace.push(json);
      if (json.action === 'initialize') {
        return {
          session: `__HIDDEN__`,
          hooking: { cjs: false, esm: false },
        };
      }
      return null;
    },
    requestAsync: () => {
      Assert.fail();
    },
  },
};

emitter.argv = ['node', 'main.js', 'arg0'];

emitter.versions = {
  node: '123.456',
};

emitter.cwd = () => '/cwd';

main(emitter);

emitter.emit('exit', 'code', 'signal');

Assert.deepEqual(trace, [
  {
    action: 'initialize',
    session: null,
    data: {
      data: {
        __proto__: null,
        engine: {
          name: 'node',
          version: '123.456',
        },
        main: {
          path: 'main.js',
        },
      },
      path: '/cwd',
    },
  },
  {
    action: 'start',
    session: `__HIDDEN__`,
    data: {
      data: {
        'class-map-pruning': false,
        'event-pruning': false,
        base: '.',
        recorder: 'normal',
      },
      path: '/cwd',
    },
  },
  {
    action: 'terminate',
    session: `__HIDDEN__`,
    data: { type: 'exit', code: 'code', signal: 'signal' },
  },
]);
