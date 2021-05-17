import { strict as Assert } from 'assert';
import { getInitialConfiguration } from '../../../../lib/server/configuration/index.mjs';
import { Dispatching } from '../../../../lib/server/dispatching.mjs';

Assert.equal(
  new Dispatching(
    getInitialConfiguration()
      .extendWithData({ enabled: false }, '/')
      .fromRight(),
    () => {
      Assert.fail();
    },
  )
    .dispatch({
      action: 'initialize',
      session: null,
      data: {
        data: {
          main: 'main.js',
        },
        path: '/',
      },
    })
    .fromRight(),
  null,
);

Assert.match(
  new Dispatching(getInitialConfiguration(), (...args) => {
    Assert.equal(args.length, 1);
    Assert.match(args[0], /^invalid request/);
  })
    .dispatch('invalid')
    .fromLeft(),
  /^invalid request/,
);

{
  const dispatching = new Dispatching(
    getInitialConfiguration()
      .extendWithData({ enabled: false }, '/')
      .fromRight(),
    () => {
      Assert.fail();
    },
  );
  dispatching
    .dispatchAsync({
      action: 'initialize',
      session: null,
      data: {
        data: {
          main: 'main.js',
        },
        path: '/',
      },
    })
    .then((either) => {
      Assert.equal(either.fromRight(), null);
      Assert.equal(dispatching.terminate().fromRight(), null);
    });
}

{
  const dispatching = new Dispatching(
    getInitialConfiguration()
      .extendWithData({ enabled: true }, '/')
      .fromRight(),
    () => {
      Assert.fail();
    },
  );
  const { session, hooking } = dispatching
    .dispatch({
      action: 'initialize',
      session: null,
      data: {
        data: {
          main: 'main.js',
        },
        path: '/',
      },
    })
    .fromRight();
  Assert.equal(typeof session, 'string');
  Assert.deepEqual(hooking, {
    esm: true,
    cjs: true,
    http: true,
  });
  const data = {
    data: {
      output: {
        'directory-path': 'tmp/test',
        'file-name': 'foo',
      },
    },
    path: process.cwd(),
  };
  dispatching
    .dispatch({
      action: 'start',
      session,
      data,
    })
    .fromRight();
  dispatching.dispatch({
    action: 'start',
    session,
    data,
  });
  dispatching
    .dispatchAsync({
      action: 'terminate',
      session,
      data: { type: 'reason-type' },
    })
    .then((either) => {
      Assert.deepEqual(either.fromRight(), null);
      dispatching.terminateAsync().then((either) => {
        Assert.equal(either.fromRight(), null);
      });
    });
}
