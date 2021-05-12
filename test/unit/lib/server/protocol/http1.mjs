
import { strict as Assert } from 'assert';
import * as Http from 'http';
import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';
import { makeDispatching } from '../../../../../lib/server/dispatching.mjs';
import { createServer } from '../../../../../lib/server/protocol/http1.mjs';

const server = createServer(makeDispatching(getInitialConfiguration()), {});
server.listen(0, () => {
  const iterator = [
    ["foo", 400, /^failed to parse as json http1 body/],
    [JSON.stringify({
      action: "initialize",
      session: null,
      data: {
        data: {
          main: "main.js"
        },
        path: "/"
      }
    }), 200, "null"]
  ][Symbol.iterator]();
  const step = () => {
    const {done, value} = iterator.next();
    if (done) {
      server.close();
    } else {
      const request = Http.request({
        host: 'localhost',
        port: server.address().port,
        method: 'PUT',
        path: '/',
      });
      request.end(value[0], "utf8");
      request.on("response", (response) => {
        Assert.equal(response.statusCode, value[1]);
        let body = "";
        response.on('data', (data) => { body += data });
        response.on('end', () => {
          if (value[2] instanceof RegExp) {
            Assert.match(body, value[2]);
          } else {
            Assert.equal(body, value[2]);
          }
          step();
        });
      });
    }
  };
  step();
});
