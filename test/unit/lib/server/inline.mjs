import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import makeChannel from '../../../../lib/server/inline.mjs';

const { requestSync, requestAsync } = makeChannel();

const {session, prefix} = requestSync({
  name: "initialize",
  env: {},
  init: {}
});

Assert.equal(typeof prefix, "string");

requestAsync({
  name: "emit",
  session,
  event: "foo"
}, null);

requestAsync({
  name: "initialize",
  env: {},
  init: {}
}, null);

requestAsync({
  name: "foo",
}, null);

{
  const trace = [];
  requestAsync({
    name: "emit",
    event: "foo"
  }, {
    reject: (...args) => {
      Assert.equal(args.length, 1);
      Assert.ok(args[0] instanceof Error);
      trace.push(args[0].message);
    },
    resolve: () => Assert.fail()
  });
  Assert.deepEqual(trace, ["Missing property: session"]);
}

{
  const trace = [];
  requestAsync({
    name: "emit",
    session,
    event: "foo"
  }, {
    reject: () => Assert.fail,
    resolve: (...args) => trace.push(args)
  });
  Assert.deepEqual(trace, [[null]]);
}
