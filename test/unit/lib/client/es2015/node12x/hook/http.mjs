import { strict as Assert } from 'assert';
import * as Module from 'module';
import { getRuntime } from '../../../../../../../lib/client/es2015/node12x/runtime.js';
import { hookHTTP } from '../../../../../../../lib/client/es2015/node12x/hook/http.js';

const require = Module.createRequire(import.meta.url);
const Http = require('http');

(async () => {
  await new Promise((resolve, reject) => {
    const events = [];
    const unhook = hookHTTP({
      ...getRuntime(),
      record: (...args) => {
        Assert.equal(args.length, 2);
        Assert.equal(args[0], null);
        events.push(args[1]);
      },
    });
    const server = Http.createServer();
    server.on('close', resolve);
    server.on('request', (request, response) => {
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (data) => {
        body += data;
      });
      request.on('end', () => {
        response.setHeader('content-type', 'text/plain; charset=utf-8');
        response.removeHeader('date');
        response.end(body, 'utf8');
      });
    });
    server.on('listening', () => {
      const request = Http.request({
        method: 'PUT',
        host: 'localhost',
        port: server.address().port,
        path: '/path?param=123#hash',
      });
      request.on('response', (response) => {
        Assert.equal(response.statusCode, 200);
        response.setEncoding('utf8');
        let body = '';
        response.on('data', (data) => {
          body += data;
        });
        response.on('end', () => {
          Assert.equal(body, 'foo');
          for (let event of events) {
            if (
              Reflect.getOwnPropertyDescriptor(event, 'elapsed') !== undefined
            ) {
              delete event.elapsed;
            }
          }
          Assert.deepEqual(events, [
            {
              id: 1,
              event: 'call',
              thread_id: null,
              http_client_request: {
                request_method: 'PUT',
                url: `http://localhost:${server.address().port}/path`,
                message: 'param=123#hash',
                headers: {
                  host: `localhost:${server.address().port}`,
                  'content-type': 'text/plain; charset=utf-8',
                },
              },
            },
            {
              id: 2,
              event: 'call',
              thread_id: null,
              http_server_request: {
                request_method: 'PUT',
                path_info: '/path?param=123#hash',
                protocol: 'HTTP/1.1',
                headers: {
                  host: `localhost:${server.address().port}`,
                  'content-type': 'text/plain; charset=utf-8',
                  connection: 'close',
                  'content-length': '3',
                },
              },
            },
            {
              id: 3,
              event: 'return',
              parent_id: 2,
              http_server_response: {
                status_code: 200,
                status_message: 'OK',
                mime_type: 'text/plain; charset=utf-8',
                headers: {
                  'content-type': 'text/plain; charset=utf-8',
                },
              },
            },
            {
              id: 4,
              event: 'return',
              thread_id: null,
              parent_id: 1,
              http_client_response: {
                status_code: 200,
                status_message: 'OK',
                mime_type: 'text/plain; charset=utf-8',
                headers: {
                  'content-type': 'text/plain; charset=utf-8',
                  connection: 'close',
                  'content-length': '3',
                },
              },
            },
          ]);
          unhook();
          server.close();
        });
      });
      request.setHeader('content-type', 'text/plain; charset=utf-8');
      request.setHeader('host', `localhost:${server.address().port}`);
      request.end('foo', 'utf8');
    });
    server.listen(0);
  });
  await new Promise((resolve, reject) => {
    const events = [];
    const unhook = hookHTTP({
      ...getRuntime(),
      record: (...args) => {
        Assert.equal(args.length, 2);
        Assert.equal(args[0], null);
        events.push(args[1]);
      },
    });
    const server = new Http.Server();
    server.on('close', resolve);
    server.on('request', (request, response) => {
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (data) => {
        body += data;
      });
      request.on('end', () => {
        response.removeHeader('content-type');
        response.removeHeader('date');
        response.end(body, 'utf8');
      });
    });
    server.on('listening', () => {
      const request = new Http.ClientRequest({
        method: 'PUT',
        host: 'localhost',
        port: server.address().port,
        path: '/path',
      });
      request.on('response', (response) => {
        Assert.equal(response.statusCode, 200);
        response.setEncoding('utf8');
        let body = '';
        response.on('data', (data) => {
          body += data;
        });
        response.on('end', () => {
          Assert.equal(body, 'foo');
          for (let event of events) {
            if (
              Reflect.getOwnPropertyDescriptor(event, 'elapsed') !== undefined
            ) {
              delete event.elapsed;
            }
          }
          Assert.deepEqual(events, [
            {
              id: 1,
              event: 'call',
              thread_id: null,
              http_client_request: {
                request_method: 'PUT',
                url: 'http://localhost/path',
                message: '',
                headers: {},
              },
            },
            {
              id: 2,
              event: 'call',
              thread_id: null,
              http_server_request: {
                request_method: 'PUT',
                path_info: '/path',
                protocol: 'HTTP/1.1',
                headers: {
                  connection: 'close',
                  'content-length': '3',
                },
              },
            },
            {
              id: 3,
              event: 'return',
              parent_id: 2,
              http_server_response: {
                status_code: 200,
                status_message: 'OK',
                mime_type: null,
                headers: {},
              },
            },
            {
              id: 4,
              event: 'return',
              thread_id: null,
              parent_id: 1,
              http_client_response: {
                status_code: 200,
                status_message: 'OK',
                mime_type: null,
                headers: {
                  connection: 'close',
                  'content-length': '3',
                },
              },
            },
          ]);
          unhook();
          server.close();
        });
      });
      request.removeHeader('content-type');
      request.removeHeader('host');
      request.end('foo', 'utf8');
    });
    server.listen(0);
  });
})();
