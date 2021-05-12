import { strict as Assert } from 'assert';
import { makeChannel } from '../../../../lib/server/inline.mjs';

const { request, requestAsync } = makeChannel({
  "hook-esm": true,
  "hook-cjs": false,
  "main": "main.js",
  enabled: true
}, "/");

requestAsync({
  action: "initialize",
  session: null,
  data: {
    data: {},
    path: "/"
  }
}).then(({session, hooking}) => {
  Assert.deepEqual(hooking, {
    esm: true,
    cjs: false
  });
  Assert.equal(
    typeof request({
      action: "start",
      session,
      data: {
        data: {},
        path: "/"
      }
    }),
    "string"
  );
});
