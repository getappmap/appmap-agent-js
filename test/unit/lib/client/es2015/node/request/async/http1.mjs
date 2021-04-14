
import * as FileSystem from "fs";
import { strict as Assert } from "assert";
import { createServer } from "http";
import makeRequestAsync from '../../../../../../../../lib/client/es2015/node/request/async/http1.js';

const server = createServer();

server.on("request", (request, response) => {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (data) => { body += data });
  request.on("end", () => {
    const json = JSON.parse(body);
    response.writeHead(json.status);
    response.end(json.body);
  });
});

let sockets = [];
server.on("connection", (socket) => {
  sockets.push(socket);
});

let counter = 0;
const increment = () => { counter += 1; };
const decrement = () => {
  counter -= 1;
  if (counter === 0) {
    sockets.forEach((socket) => {
      socket.end();
    });
    server.close();
    makeRequestAsync("localhost", "tmp/ipc.sock");
  }
};

server.listen(0, () => {
  let callback = null;
  const requestAsync = makeRequestAsync("localhost", server.address().port, (...args) => {
    Assert.equal(args.length, 1);
    callback(args[0]);
  });
  increment();
  requestAsync({status:200, body:"null"}, null);
  callback = (error) => {
    Assert.deepEqual(error, null);
    requestAsync({status:200, body:"123"}, null);
    callback = (error) => {
      Assert.ok(error instanceof Error);
      Assert.equal(error.message, "Unexpected non-null success");
      requestAsync({status:400, body:"BOUM"}, null);
      callback = (error) => {
        Assert.ok(error instanceof Error);
        Assert.equal(error.message, "http 400 >> BOUM");
        decrement();
      }
    }
  }
  increment();
  requestAsync({
    status: 200,
    body: "123"
  }, {
    reject: () => Assert.fail("Unexpected rejection"),
    resolve: (...args) => {
      Assert.deepEqual(args, [123]);
      decrement();
    }
  });
  increment();
  requestAsync({
    status: 400,
    body: "@BOUM"
  }, {
    reject: (...args) => {
      Assert.equal(args.length, 1);
      Assert.ok(args[0] instanceof Error);
      Assert.equal(args[0].message, "http 400 >> @BOUM");
      decrement();
    },
    resolve: () => Assert.fail("Unexpected rejection"),
  });
  increment();
  requestAsync({
    status: 200,
    body: "@invalid-json"
  }, {
    reject: (...args) => {
      Assert.equal(args.length, 1);
      Assert.ok(args[0] instanceof Error);
      Assert.equal(args[0].message, "Unexpected token @ in JSON at position 0");
      decrement();
    },
    resolve: () => Assert.fail("Unexpected rejection"),
  });
});
