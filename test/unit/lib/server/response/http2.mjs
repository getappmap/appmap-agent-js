import { strict as Assert } from 'assert';
import { connect } from 'http2';
import { makeServer } from '../../../../../lib/server/response/http2.mjs';

const dispatcher = {
  __proto__: null,
};

const server = makeServer(dispatcher, {});

server.on('stream', (stream) => {
  stream.emit('error', 'FooBar');
});

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
      return null;
    },
    input: JSON.stringify(123),
    status: 200,
    body: "",
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

let session;

const step = () => {
  const { done, value } = iterator.next();
  if (done) {
    session.close();
    server.close();
  } else {
    dispatcher.dispatch = value.dispatch;
    const stream = session.request({
      ':method': 'PUT',
      ':path': '/',
    });
    stream.end(value.input, 'utf8');
    stream.on('response', (headers) => {
      Assert.equal(headers[':status'], value.status);
      stream.setEncoding('utf8');
      let body = '';
      stream.on('data', (data) => {
        body += data;
      });
      stream.on('end', () => {
        Assert.equal(body, value.body);
        step();
      });
    });
  }
};

server.listen(0, () => {
  session = connect(`http://localhost:${server.address().port}/`);
  step();
});
