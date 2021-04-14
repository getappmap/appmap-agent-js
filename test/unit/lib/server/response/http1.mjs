import { strict as Assert } from 'assert';
import { request as connect } from 'http';
import { makeServer } from '../../../../../lib/server/response/http1.mjs';

const dispatcher = {
  __proto__: null,
};

const iterator = [
  {
    dispatch(...args) {
      Assert.equal(this, dispatcher);
      Assert.deepEqual(args, [123]);
      return 456;
    },
    input: JSON.stringify(123),
    status: 200,
    body: JSON.stringify(456),
  },
  {
    dispatch(...args) {
      Assert.equal(this, dispatcher);
      Assert.deepEqual(args, [123]);
      throw new Error('BOUM');
    },
    input: JSON.stringify(123),
    status: 400,
    body: 'BOUM',
  },
][Symbol.iterator]();

const server = makeServer(dispatcher, {});

server.on('request', (request, response) => {
  request.emit('error', new Error('Foo'));
  response.emit('error', new Error('Bar'));
});

server.listen(0, () => {
  const step = () => {
    const { done, value } = iterator.next();
    if (done) {
      server.close();
    } else {
      dispatcher.dispatch = value.dispatch;
      const request = connect({
        host: 'localhost',
        port: server.address().port,
        method: 'PUT',
        path: '/',
      });
      request.end(value.input, 'utf8');
      request.on('response', (response) => {
        Assert.equal(response.statusCode, value.status);
        response.setEncoding('utf8');
        let body = '';
        response.on('data', (data) => {
          body += data;
        });
        response.on('end', () => {
          Assert.equal(body, value.body);
          step();
        });
      });
    }
  };
  step();
});
