import { strict as Assert } from 'assert';
import {Socket} from 'net';
import {spawnSync} from "child_process";
import { patch } from 'net-socket-messaging';
import component from './index.test.mjs';

const trace = [];

spawnSync("rm", ["tmp/sock", "-f"]);

component({
  open: () => ({
    close: (...args) => {
      trace.push(["close", ...args]);
    }
    receive: (...args) => {
      trace.push(["receive", ...args]);
    }
  })
}, {port:"tmp/sock"}).openAsync().then(({life, close}) => {
  life.then(() => {
    console.log("DONE");
  }, (error) => {
    throw error;
  });
  const socket = new Socket();
  patch(socket);
  socket.connect("tmp/sock");
  socket.send("foo");
  setTimeout(close, 100);
});





const server = createServer();
server.listen(0, () => {
  attach(server, new Dispatching(getInitialConfiguration(), () => {}));
  const socket = Net.connect(server.address().port);
  patch(socket);
  const iterator = [
    [
      'foo',
      { head: null, type: 'left', body: /^failed to parse json message/ },
    ],
    [
      JSON.stringify({ body: 'foo' }),
      { head: null, type: 'left', body: 'missing head field' },
    ],
    [
      JSON.stringify({ head: 123 }),
      { head: 123, type: 'left', body: 'missing body field' },
    ],
    [
      JSON.stringify({
        head: 456,
        body: {
          action: 'initialize',
          session: null,
          data: {
            cwd: '/',
            main: {
              path: 'main.js',
            },
          },
        },
      }),
      { head: 456, type: 'right', body: null },
    ],
    [
      JSON.stringify({
        head: null,
        body: {
          action: 'initialize',
          session: null,
          data: {
            cwd: '/',
            enabled: true,
            main: {
              path: 'main.js',
            },
          },
        },
      }),
      { head: null, type: 'left', body: /^expected a null result/ },
    ],
  ][Symbol.iterator]();
  const step = () => {
    const { done, value } = iterator.next();
    if (done) {
      socket.end();
      server.close();
    } else {
      socket.removeAllListeners('message');
      socket.on('message', (response) => {
        let data = JSON.parse(response);
        if (value[1].body instanceof RegExp) {
          data = { __proto__: null, ...data };
          Assert.equal(data.head, value[1].head);
          Assert.equal(data.type, value[1].type);
          Assert.match(data.body, value[1].body);
        } else {
          Assert.deepEqual(data, value[1]);
        }
        step();
      });
      socket.send(value[0]);
    }
  };
  step();
});
