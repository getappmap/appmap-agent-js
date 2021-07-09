import * as Http2 from 'http2';
import { logger } from '../logger.mjs';
import { toEither } from '../either.mjs';

export const createServer = (options) => Http2.createServer(options);

const locateMessage = (message) =>
  `failed to parse as json http2 body >> ${message}`;

/* c8 ignore start */
const onStreamError = (error) => {
  logger.error('http2 stream error >> %s', error.message);
};
/* c8 ignore stop */

export default = ({backend:{open}}, {port}) => ({
  openAsync: () => new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    const sessions = new Set();
    const onStreamError = (error) => {
      server.emit("error", error);
    };
    server.on("session", (session) => {
      sessions.add(session);
      sessions.on("close", () => {
        sessions.delete(sessions);
      });
    });
    server.on("listening", () => {
      server.removeAllListeners("error");
      resolve({
        life: new Promise((resolve, reject) => {
          server.on("error", (error) => {
            server.close();
            for (let stream of streams) {
              stream.destroy();
            }
            reject(error);
          });
          server.on("close", resolve);
        }),
        close: () => {
          server.close();
          for (let session of sessions) {
            session.close();
          }

        }
      });
    });
  });

  }
});

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
