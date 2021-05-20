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
}).then(({ session, hooking }) => {
  Assert.deepEqual(hooking, {
    esm: true,
    cjs: true,
    http: true,
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
