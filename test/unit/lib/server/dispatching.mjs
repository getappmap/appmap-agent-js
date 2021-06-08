import { strict as Assert } from 'assert';
import { getInitialConfiguration } from '../../../../lib/server/configuration/index.mjs';
import { Dispatching } from '../../../../lib/server/dispatching.mjs';

Assert.equal(
  new Dispatching(
    getInitialConfiguration()
      .extendWithData({ enabled: false, cwd: '/' })
      .fromRight(),
  )
    .dispatch({
      action: 'initialize',
      session: null,
      data: {
        cwd: '/',
        main: 'main.js',
      },
    })
    .fromRight(),
  null,
);

{
  const dispatching = new Dispatching(
    getInitialConfiguration()
      .extendWithData({ enabled: false, cwd: '/' })
      .fromRight(),
  );
  dispatching
    .dispatchAsync({
      action: 'initialize',
      session: null,
      data: {
        cwd: '/',
        main: 'main.js',
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
      .extendWithData({ enabled: true, cwd: '/' })
      .fromRight(),
  );
  const { session, hooks } = dispatching
    .dispatch({
      action: 'initialize',
      session: null,
      data: {
        cwd: '/',
        main: 'main.js',
      },
    })
    .fromRight();
  Assert.equal(typeof session, 'string');
  Assert.deepEqual(hooks, {
    esm: {},
    cjs: {},
    http: null,
    mysql: null,
    pg: null,
    sqlite3: null,
  });
  const data = {
    cwd: process.cwd(),
    output: {
      directory: 'tmp/test',
      'file-name': 'foo',
    },
  };
  dispatching
    .dispatch({
      action: 'start',
      session,
      data,
    })
    .fromRight();
  dispatching
    .dispatch({
      action: 'start',
      session,
      data,
    })
    .fromRight();
  // dispatching.dispatch({
  //   action: 'start',
  //   session,
  //   data,
  // }).fromRight();
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
