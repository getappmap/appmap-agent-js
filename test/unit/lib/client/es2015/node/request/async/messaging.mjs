
import * as FileSystem from "fs";
import { strict as Assert } from "assert";
import { createServer } from "net";
import { patch } from "net-socket-messaging";
import makeRequestAsync from '../../../../../../../../lib/client/es2015/node/request/async/messaging.js';

const server = createServer();
let socket = null;

server.on("connection", (argument) => {
  Assert.equal(socket, null);
  socket = argument;
  patch(socket);
  socket.on("message", (message) => {
    const json = JSON.parse(message);
    socket.send(JSON.stringify({
      index: json.index,
      success: json.query.success,
      failure: json.query.failure
    }));
  });
});

let counter = 0;
const increment = () => { counter += 1; }
const decrement = () => {
  counter -= 1;
  if (counter === 0) {
    socket.end();
    server.close();
    {
      const path = "tmp/ipc.sock";
      try { FileSystem.unlinkSync(path); } catch (error) {}
      const server = createServer();
      server.on("connection", (socket) => {
        socket.end();
        server.close();
      });
      server.listen(path, () => {
        makeRequestAsync("localhost", path);
      });
    }
  }
}

server.listen(0, () => {
  let callback = null;
  const requestAsync = makeRequestAsync("localhost", server.address().port, (...args) => {
    Assert.deepEqual(args.length, 1);
    callback(args[0]);
  });
  increment();
  requestAsync({
    success: null,
    failure: null
  }, null);
  callback = (error) => {
    Assert.equal(error, null);
    requestAsync({
      success: 123,
      failure: null
    }, null);
    callback = (error) => {
      Assert.ok(error instanceof Error);
      Assert.equal(error.message, "Unexpected non-null success");
      requestAsync({
        success: null,
        failure: "BOUM"
      }, null);
      callback = (error) => {
        Assert.ok(error instanceof Error);
        Assert.equal(error.message, "BOUM");
        decrement();
      }
    }
  }
  increment();
  requestAsync({
    success: 123,
    failure: null
  }, {
    resolve: (...args) => {
      Assert.deepEqual(args, [123]);
      requestAsync({
        success: null,
        failure: "@BOUM"
      }, {
        resolve: () => {
          Assert.fail("Unexpected resolve");
        },
        reject: (...args) => {
          Assert.equal(args.length, 1);
          Assert.ok(args[0] instanceof Error);
          Assert.equal(args[0].message, "@BOUM");
          decrement();
        }
      });
    },
    reject: () => {
      Assert.fail("Unexpected reject");
    }
  });
});
