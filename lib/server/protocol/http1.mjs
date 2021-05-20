import * as Http from 'http';
import { logger } from '../logger.mjs';
import { toEither } from '../either.mjs';

export const createServer = (options) => Http.createServer(options);

/* c8 ignore start */
const onRequestError = (error) => {
  logger.error('http1 request error >> %s', error.message);
};
/* c8 ignore stop */

/* c8 ignore start */
const onResponseError = (error) => {
  logger.error('http1 response error >> %s', error.message);
};
/* c8 ignore stop */

export const attach = (server, dispatching) => {
  const dispatchAsync = (request) => dispatching.dispatchAsync(request);
  server.on('request', (request, response) => {
    request.on('error', onRequestError);
    response.on('error', onResponseError);
    logger.debug(
      'http1 request head: %s %s %j',
      request.method,
      request.url,
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
            },
          );
        });
    });
  });
};
