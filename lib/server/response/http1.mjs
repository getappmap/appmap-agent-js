import * as Http from 'http';
import {logger} from '../logger.mjs';
import {toEither} from "../either.mjs";

export const makeServer = ({dispatchAsync}, options) => {
  const server = Http.createServer(options);
  server.on('request', (request, response) => {
    logger.debug(
      'http1 request head: %s %s %j',
      request.method,
      request.path,
      request.headers,
    );
    request.setEncoding('utf8');
    let body = '';
    request.on('data', (data) => {
      body += data;
    });
    request.on('end', () => {
      logger.debug('http1 request body >> %s', body);
      toEither(JSON.parse, 'failed to parse as json http1 body', body)
        .bindAsync(dispatchAsync)
        .then((either) => {
          either.either(
            (message) => {
              logger.debug('http1 request failure: %j', message);
              response.writeHead(400, {
                'content-type': 'text/plain; charset=utf-8',
              });
              response.end(message, 'utf8');
            },
            (data) => {
              logger.debug('http1 request success: %j', body);
              response.writeHead(200, {
                'content-type': 'application/json; charset=utf-8',
              });
              response.end(JSON.stringify(data), 'utf8');
            }
          );
        });
    });
  });
  return server;
};
