import { strict as Assert } from 'assert';
import { request } from 'http';
import { makeServer } from '../../../../../lib/server/response/http1.mjs';

const dispatcher = {
  __proto__: null,
};

const server = makeServer(dispatcher);

const test1 = (callback) => {
  dispatcher.dispatch = function dispatch(...args) {
    Assert.equal(this, dispatcher);
    Assert.deepEqual(args, [123]);
    return 456;
  };
  request({
    host: 'localhost',
    port: 8080,
    method: 'PUT',
    path: '/',
  })
    .end('123')
    .on('response', (response) => {
      Assert.equal(response.statusCode, 200);
      response.setEncoding('utf8');
      let body = '';
      response.on('data', (data) => {
        body += data;
      });
      response.on('end', () => {
        Assert.equal(JSON.parse(body), 456);
        callback();
      });
    });
};

const test2 = (callback) => {
  dispatcher.dispatch = () => {
    throw new Error('BOUM');
  };
  request({
    host: 'localhost',
    port: 8080,
    method: 'PUT',
    path: '/',
  })
    .end('789')
    .on('response', (response) => {
      Assert.equal(response.statusCode, 400);
      response.setEncoding('utf8');
      let body = '';
      response.on('data', (data) => {
        body += data;
      });
      response.on('end', () => {
        Assert.equal(body, 'BOUM');
        callback();
      });
    });
};

server.listen(8080, () => {
  test1(() => test2(() => server.close()));
});
