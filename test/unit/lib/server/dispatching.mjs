import { strict as Assert } from 'assert';
import { getInitialConfiguration } from '../../../../lib/server/configuration/index.mjs';
import {makeDispatching} from '../../../../lib/server/dispatching.mjs';

Assert.equal(
  makeDispatching(getInitialConfiguration().extendWithData({ enabled: false }, "/").fromRight()).dispatch({
    action: "initialize",
    session: null,
    data: {
      data: {
        "main": "main.js"
      },
      path: "/"
    }
  }).fromRight(),
  null
);

makeDispatching(getInitialConfiguration().extendWithData({ enabled: false }, "/").fromRight()).dispatchAsync({
  action: "initialize",
  session: null,
  data: {
    data: {
      "main": "main.js"
    },
    path: "/"
  }
}).then((either) => {
  Assert.equal(either.fromRight(), null);
});

{
  const {dispatch, dispatchAsync} = makeDispatching(getInitialConfiguration().extendWithData({ enabled: true }, "/").fromRight());
  const session = dispatch({
    action: "initialize",
    session: null,
    data: {
      data: {
        "main": "main.js"
      },
      path: "/"
    }
  }).fromRight();
  Assert.equal(typeof session, "string");
  const data = {
    data: {
      output: {
        "directory-path": "tmp/test",
        "file-name": "foo"
      }
    },
    path: process.cwd()
  };
  dispatch({
    action: "start",
    session,
    data
  }).fromRight();
  dispatch({
    action: "start",
    session,
    data
  });
  dispatchAsync({
    action: "terminate",
    session,
    data: {type:"reason-type"}
  }).then((either) => {
    Assert.deepEqual(
      either.fromRight(),
      null
    );
  });
}
