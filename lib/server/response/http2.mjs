import { createServer } from 'http2';
import logger from '../logger.mjs';

const onStreamError = (error) => {
  logger.error('http2 stream error %s', error.stack);
};

export const makeServer = (dispatcher, options) => {
  const server = createServer(options);
  server.on('stream', (stream, headers1) => {
    logger.info('http2 request head: %j', headers1);
    stream.setEncoding('utf8');
    stream.on('error', onStreamError);
    let body1 = '';
    stream.on('data', (data) => {
      body1 += data;
    });
    stream.on('end', () => {
      logger.info('http2 request body: %s', body1);
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
        logger.info('http2 response body: <null-optimized>');
        stream.respond({
          ':status': 200,
        });
        stream.end();
        return null;
      }
      logger.info('http2 response body: %s', body2);
      stream.respond({
        ':status': 200,
        'content-type': 'application/json; charset=utf-8',
      });
      stream.end(body2, 'utf8');
      return null;
    });
  });
  return server;
};
