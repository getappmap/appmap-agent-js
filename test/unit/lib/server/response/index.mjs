import { makeServer } from '../../../../../lib/server/response/index.mjs';

const dispatcher = { __proto__: null };
const options = {};
makeServer('foobar', dispatcher, options);

const server = makeServer('messaging', dispatcher, options);
server.emit('error', new Error('FooBar'));
server.listen(0, () => {
  server.close();
});
