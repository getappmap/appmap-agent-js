import { strict as Assert } from 'assert';
import { getDefaultConfiguration } from '../../../../lib/server/configuration.mjs';
import Dispatcher from '../../../../lib/server/dispatcher.mjs';

Assert.deepEqual(
  new Dispatcher(
    getDefaultConfiguration().extendWithData({ enabled: false }, null),
  ).dispatch({
    name: 'initialize',
    process: {
      env: {},
      argv: ['node', 'script.js'],
    },
    configuration: {},
  }),
  { session: null, prefix: null },
);

const dispatcher = new Dispatcher(getDefaultConfiguration());

const { session, prefix } = dispatcher.dispatch({
  name: 'initialize',
  process: {
    env: {},
    argv: ['node', 'script.js'],
  },
  configuration: {},
});

Assert.equal(typeof prefix, 'string');

Assert.throws(() =>
  dispatcher.dispatch({
    name: 'foo',
    session,
  }),
);

dispatcher.dispatch({
  name: 'instrument',
  session,
  source: 'script',
  path: 'filename.js',
  content: '({})',
});

Assert.throws(() =>
  dispatcher.dispatch({
    name: 'instrument',
    session,
    source: 'foo',
    path: 'filename.js',
    content: '({})',
  }),
);

dispatcher.dispatch({
  name: 'record',
  session,
  event: {
    event: 'call',
    id: 0,
  },
});

dispatcher.dispatch({
  name: 'terminate',
  session,
  sync: true,
  reason: 'reason',
});

Assert.throws(() => dispatcher.dispatch(null));

Assert.throws(() =>
  dispatcher.dispatch({
    name: 'terminate',
    session: 123,
    sync: true,
    reason: 'reason',
  }),
);

Assert.throws(() =>
  dispatcher.dispatch({
    name: 'terminate',
    session,
    sync: true,
    reason: null,
  }),
);
