import * as Http2 from 'http2';
import { logger } from '../logger.mjs';
import { toEither } from '../either.mjs';

export const createServer = (options) => Http2.createServer(options);

const locateMessage = (message) => `failed to parse as json http2 body >> ${message}`;

/* c8 ignore start */
const onStreamError = (error) => {
  logger.error('http2 stream error >> %s', error.message);
};
/* c8 ignore stop */

export const attach = (server, dispatching) => {
  const dispatchAsync = (request) => dispatching.dispatchAsync(request);
  server.on('stream', (stream, headers1) => {
    stream.on('error', onStreamError);
    logger.debug('http2 request head %j', headers1);
    stream.setEncoding('utf8');
    let body = '';
    stream.on('data', (data) => {
      body += data;
    });
    stream.on('end', () => {
      logger.debug('http2 request body >> %s', body);
      toEither(JSON.parse, body)
        .mapLeft(locateMessage)
        .bindAsync(dispatchAsync)
        .then((either) => {
          either.either(
            (message) => {
              logger.debug('http2 request failure: %j', message);
              stream.respond({
                ':status': 400,
                'content-type': 'text/plain; charset=utf-8',
              });
              stream.end(message, 'utf8');
            },
            (data) => {
              logger.debug('http1 request success: %j', data);
              stream.respond({
                ':status': 200,
                'content-type': 'application/json; charset=utf-8',
              });
              stream.end(JSON.stringify(data), 'utf8');
            },
          );
        });
    });
  });
};
