import { strict as Assert } from 'assert';
import * as Http2 from 'http2';
import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';
import { Dispatching } from '../../../../../lib/server/dispatching.mjs';
import {
  createServer,
  attach,
} from '../../../../../lib/server/protocol/http2.mjs';

const server = createServer();
server.listen(0, () => {
  attach(server, new Dispatching(getInitialConfiguration(), () => {}));
  const client = Http2.connect(`http://localhost:${server.address().port}`);
  const iterator = [
    ['foo', 400, /^failed to parse as json http2 body/],
    [
      JSON.stringify({
        action: 'initialize',
        session: null,
        data: {
          data: {
            main: 'main.js',
          },
          path: '/',
        },
      }),
      200,
      'null',
    ],
  ][Symbol.iterator]();
  const step = () => {
    const { done, value } = iterator.next();
    if (done) {
      client.close();
      server.close();
    } else {
      const stream = client.request({
        ':method': 'PUT',
        ':path': '/',
      });
      stream.end(value[0], 'utf8');
      stream.on('response', (headers) => {
        Assert.equal(headers[':status'], value[1]);
      });
      let body = '';
      stream.on('data', (data) => {
        body += data;
      });
      stream.on('end', () => {
        if (value[2] instanceof RegExp) {
          Assert.match(body, value[2]);
        } else {
          Assert.equal(body, value[2]);
        }
        step();
      });
    }
  };
  step();
});
