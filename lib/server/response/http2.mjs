import { createServer } from 'http2';
import logger from '../logger.mjs';

const onStreamError = (error) => {
  logger.error('http2 stream error %s', error.stack);
};

export const makeServer = (dispatcher, options) => {
  const server = createServer(options);
  server.on('stream', (stream, headers1) => {
    logger.debug('http2 request head %j', headers1);
    stream.setEncoding('utf8');
    stream.on('error', onStreamError);
    let body = '';
    stream.on('data', (data) => {
      body += data;
    });
    stream.on('end', () => {
      logger.debug('http2 request body >> %s', body1);
      toEither(JSON.parse, "failed to parse as json http2 body", body)
        .bindAsync(dispatchAsync)
        .then((either) => {
          either.either(
            (body) => {
              stream.respond({
                ':status': 400,
                'content-type': 'text/plain; charset=utf-8',
              });
              stream.end(body, 'utf8');
            },
            (data) => {
              const body = JSON.stringify(data);
              stream.respond({
                ':status': 200,
                'content-type': 'application/json; charset=utf-8',
              });
              stream.end(JSON.stringify(data), 'utf8');
            }
        }
      let body2;
      try {
        body2 = JSON.stringify(dispatcher.dispatch(JSON.parse(body1)));
      } catch (error) {
        logger.error('Error while processing %s\n%s', body1, error.stack);
        stream.respond({
          ':status': 400,
          'content-type': 'text/plain; charset=utf-8',
        });
        stream.end(error.message, 'utf8');
        return null;
      }
      if (body2 === 'null') {
        logger.debug('http2 response body: <null-optimized>');
        stream.respond({
          ':status': 200,
        });
        stream.end();
        return null;
      }
      logger.debug('http2 response body: %s', body2);

      return null;
    });
  });
  return server;
};
