import { createServer } from 'http';
import logger from '../logger.mjs';

export const makeServer = (dispatcher, options) => {
  const server = createServer(options);
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
              logger.debug('http1 request failure >> %s', message);
              response.writeHead(400, {
                'content-type': 'text/plain; charset=utf-8',
              });
              response.end(message, 'utf8');
            },
            (body) => {
              logger.debug('http1 request success >> %s', body);
              response.writeHead(200, {
                'content-type': 'application/json; charset=utf-8',
              });
              response.end(body, 'utf8');
            }
          );
        });
    });
  });
  return server;
};
