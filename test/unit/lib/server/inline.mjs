import { strict as Assert } from 'assert';
import { makeChannel } from '../../../../lib/server/inline.mjs';

const { requestSync, requestAsync } = makeChannel();

const { session, prefix } = requestSync({
  name: 'initialize',
  process: {
    version: 'version',
    env: {},
    argv: ['node', 'script.js'],
  },
  configuration: {},
});

Assert.equal(typeof prefix, 'string');

requestAsync(
  {
    name: 'record',
    session,
    event: {
      id: 123,
      event: 'call',
    },
  },
  null,
);

requestAsync(
  {
    name: 'instrument',
    session,
    source: 'script',
    path: 'main.js',
    content: '123;',
  },
  null,
);

requestAsync(
  {
    name: 'foo',
  },
  null,
);

{
  const trace = [];
  requestAsync(
    {
      name: 'record',
      event: {
        id: 456,
        event: 'call',
      },
    },
    {
      reject: (...args) => {
        Assert.equal(args.length, 1);
        Assert.ok(args[0] instanceof Error);
        trace.push(args[0].message);
      },
      resolve: () => Assert.fail(),
    },
  );
  Assert.deepEqual(trace.length, 1);
  Assert.ok(trace[0].startsWith('invalid request'));
}

{
  const trace = [];
  requestAsync(
    {
      name: 'record',
      session,
      event: {
        id: 789,
        event: 'call',
      },
    },
    {
      reject: () => Assert.fail,
      resolve: (...args) => trace.push(args),
    },
  );
  Assert.deepEqual(trace, [[null]]);
}
