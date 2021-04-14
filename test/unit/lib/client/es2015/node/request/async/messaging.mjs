
import * as FileSystem from "fs";
import { strict as Assert } from "assert";
import { createServer } from "net";
import { patch } from "net-socket-messaging";
import makeRequestAsync from '../../../../../../../../lib/client/es2015/node/request/async/messaging.js';

const server = createServer();
let socket = null;

server.on("connection", (argument) => {
  if (socket !== null) {
    throw new Error("Unexpected multiple connection");
  }
  socket = argument;
  patch(socket);
  socket.on("message", (message) => {
    const json = JSON.parse(message);
    if (json.index !== null) {
      socket.send(JSON.stringify({
        index: json.index,
        success: json.query.success,
        failure: json.query.failure
      }));
    }
  });
});

server.listen(0, () => {
  const requestAsync = makeRequestAsync("localhost", server.address().port);
  requestAsync({}, null);
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
          socket.end();
          server.close();
          const path = "/tmp/ipc.sock";
          try {
            FileSystem.unlinkSync(path);
          } finally {
            const server = createServer();
            server.on("connection", (socket) => {
              socket.end();
              server.close();
            })
            server.listen(path, () => {
              makeRequestAsync("localhost", path);
            });
          }
        }
      });
    },
    reject: () => {
      Assert.fail("Unexpected reject");
    }
  });
});
