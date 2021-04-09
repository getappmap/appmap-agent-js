
import { strict as Assert } from 'assert';
import { getDefaultConfig } from  '../../../../lib/server/config.mjs';
import Dispatcher from '../../../../lib/server/dispatcher.mjs';

const dispatcher = new Dispatcher(getDefaultConfig());

const {session, prefix} = dispatcher.dispatch({
  name: "initialize",
  env: {},
  init: {}
});

Assert.throws(() => dispatcher.dispatch({
  name: "foo",
  session
}));

dispatcher.dispatch({
  name: "instrument",
  session,
  source: "script",
  path: "filename.js",
  content: "({})"
});

Assert.throws(() => dispatcher.dispatch({
  name: "instrument",
  session,
  source: "foo",
  path: "filename.js",
  content: "({})"
}));

dispatcher.dispatch({
  name: "emit",
  session,
  event: "event"
});

dispatcher.dispatch({
  name: "terminate",
  session,
  reason: "reason"
});

Assert.throws(() => dispatcher.dispatch(null));

Assert.throws(() => dispatcher.dispatch({
  name: "terminate",
  session: 123,
  reason: "reason"
}));

Assert.throws(() => dispatcher.dispatch({
  name: "terminate",
  session,
  reason: "reason"
}));
