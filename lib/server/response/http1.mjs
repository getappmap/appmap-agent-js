import { createServer } from 'http';
import logger from '../logger.mjs';

const onRequestError = (error) => {
  logger.error('http1 request error %s', error.stack);
};

const onResponseError = (error) => {
  logger.error('http1 response error %s', error.stack);
};

export const makeServer = (dispatcher, options) => {
  const server = createServer(options);
  server.on('request', (request, response) => {
    logger.info(
      'http1 request head: %s %s %j',
      request.method,
      request.path,
      request.headers,
    );
    request.setEncoding('utf8');
    request.on('error', onRequestError);
    response.on('error', onResponseError);
    let body1 = '';
    request.on('data', (data) => {
      body1 += data;
    });
    request.on('end', () => {
      logger.info('http1 request body: %s', body1);
      let body2;
      try {
        body2 = JSON.stringify(dispatcher.dispatch(JSON.parse(body1)));
      } catch (error) {
        logger.error('Error during handling of: %s \n%s', body1, error.stack);
        response.writeHead(400, {
          'content-type': 'text/plain; charset=utf-8',
        });
        response.end(error.message, 'utf8');
        return null;
      }
      if (body2 === 'null') {
        logger.info('http1 response 200 null-optimized');
        response.writeHead(200);
        response.end();
        return null;
      }
      logger.info('http1 response 200 %s', body2);
      response.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
      });
      response.end(body2, 'utf8');
      return null;
    });
  });
  return server;
};
