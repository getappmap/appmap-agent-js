import { strict as Assert } from 'assert';
import EventEmitter from 'events';
import { connect } from "net";
import { patch } from "net-socket-messaging";
import { makeServer } from '../../../../../lib/server/response/messaging.mjs';

const dispatcher = {
  __proto__: null,
};

const server = makeServer(dispatcher, {});

server.on("connection", (socket) => {
  socket.emit("error", new Error("FooBar"));
});

const noop = () => {};

const iterator = [
  {
    dispatch (...args) {
      Assert.equal(this, dispatcher);
      Assert.deepEqual(args, [123]);
      return 456;
    },
    input: JSON.stringify({
      index: 789,
      query: 123
    }),
    output: {
      index: 789,
      success: 456,
      failure: null
    }
  },
  {
    dispatch (...args) {
      Assert.equal(this, dispatcher);
      Assert.deepEqual(args, [123]);
      throw new Error('BOUM');
    },
    input: JSON.stringify({
      index: 789,
      query: 123
    }),
    output: {
      index: 789,
      success: null,
      failure: "BOUM"
    }
  },
  {
    dispatch: noop,
    input: "@invalid-json",
    output: {
      index: null,
      success: null,
      failure: "Unexpected token @ in JSON at position 0"
    }
  },
  {
    dispatch: noop,
    input: JSON.stringify({
      query: 123
    }),
    output: {
      index: null,
      success: null,
      failure: "Missing index field"
    }
  },
  {
    dispatch: noop,
    input: JSON.stringify({
      index: 789
    }),
    output: {
      index: 789,
      success: null,
      failure: "Missing query field"
    }
  },
  {
    dispatch: noop,
    input: JSON.stringify({
      index: 789
    }),
    output: {
      index: 789,
      success: null,
      failure: "Missing query field"
    }
  },
  {
    dispatch: () => 456,
    input: JSON.stringify({
      index: null,
      query: 123
    }),
    output: {
      index: null,
      success: null,
      failure: "Query expected null as a response"
    }
  },
  {
    dispatch: () => null,
    input: JSON.stringify({
      index: null,
      query: 123
    }),
    output: null
  },
][Symbol.iterator]();

const step = () => {
  const {done, value} = iterator.next();
  if (done) {
    server.close();
  } else {
    dispatcher.dispatch = value.dispatch;
    const socket = connect(server.address().port);
    patch(socket);
    socket.send(value.input);
    if (value.output === null) {
      socket.end();
    } else {
      socket.on("message", (message) => {
        Assert.deepEqual(JSON.parse(message), value.output);
        socket.end();
      });
    }
    socket.on("close", step);
  }
};

server.listen(0, step);
