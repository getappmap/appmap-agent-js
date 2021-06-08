import { strict as Assert } from 'assert';
import { makeChannel } from '../../../../lib/server/inline.mjs';

const { request, requestAsync } = makeChannel();

requestAsync({
  action: 'initialize',
  session: null,
  data: {
    cwd: '/',
    main: 'main.js',
    enabled: true,
  },
}).then(({ session, hooks }) => {
  Assert.deepEqual(hooks, {
    esm: {},
    cjs: {},
    http: null,
    mysql: null,
    pg: null,
    sqlite3: null,
  });
  Assert.equal(
    typeof request({
      action: 'start',
      session,
      data: { cwd: '/' },
    }),
    'string',
  );
});
