import * as Http2 from 'http2';
import {logger} from '../logger.mjs';
import {toEither} from "../either.mjs";

export const makeServer = ({dispatchAsync}, options) => {
  const server = Http2.createServer(options);
  server.on('stream', (stream, headers1) => {
    logger.debug('http2 request head %j', headers1);
    stream.setEncoding('utf8');
    let body = '';
    stream.on('data', (data) => {
      body += data;
    });
    stream.on('end', () => {
      logger.debug('http2 request body >> %s', body);
      toEither(JSON.parse, "failed to parse as json http2 body", body)
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
            }
          );
        });
    });
  });
  return server;
};
