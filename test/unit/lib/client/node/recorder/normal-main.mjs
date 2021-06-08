import { strict as Assert } from 'assert';
import { EventEmitter } from 'events';
import { main } from '../../../../../../lib/client/node/recorder/normal-main.js';

const emitter = new EventEmitter();
const trace = [];

emitter.env = {
  APPMAP_PROTOCOL: {
    request: (json) => {
      trace.push(json);
      if (json.action === 'initialize') {
        return {
          session: `__HIDDEN__`,
          hooks: {},
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
      __proto__: null,
      cwd: '/cwd',
      engine: {
        name: 'node',
        version: '123.456',
      },
      main: {
        path: 'main.js',
      },
    },
  },
  {
    action: 'start',
    session: `__HIDDEN__`,
    data: {
      cwd: '/cwd',
      'class-map-pruning': false,
      'event-pruning': false,
      base: '.',
      recorder: 'normal',
    },
  },
  {
    action: 'terminate',
    session: `__HIDDEN__`,
    data: { type: 'exit', code: 'code', signal: 'signal' },
  },
]);
