
import { createServer } from "net";
import { patch } from "net-socket-messaging";
import logger from '../logger.mjs';

const onSocketError = (error) => {
  logger.error('Socket error: %s', error.stack);
};

const empty = Symbol("empty");

export const makeServer = (dispatcher, options) => {
  const server = createServer(options);
  server.on("connection", (socket) => {
    socket.setNoDelay(true);
    socket.on('error', onSocketError);
    patch(socket);
    socket.on("message", (message) => {
      logger.info("messaging request: %j", message);
      let json = empty;
      try {
        json = JSON.parse(message);
      } catch (error) {
        logger.error('Cannot JSON.parse message: %s', message, error.message);
      }
      if (json !== empty) {
        if (Reflect.getOwnPropertyDescriptor(json, 'index') === undefined) {
          logger.error('Missing index field on %j', json);
        } else if (Reflect.getOwnPropertyDescriptor(json, 'query') === undefined) {
          logger.error('Missing query field on %j', json);
        } else {
          let success = null;
          let failure = null;
          try {
            success = dispatcher.dispatch(json.query);
          } catch (error) {
            logger.error(`Error while handling %j\n%s`, json, error.stack);
            failure = error.message;
          }
          if (json.index === null) {
            if (success !== null) {
              logger.error('Expected dispatcher to return null, got: %j', success);
            }
          } else {
            logger.info(
              'messaging response: {index:%j, success:%j, failure: %j}',
              json.index,
              success,
              failure,
            );
            socket.send(JSON.stringify({
              index: json.index,
              success,
              failure,
            }));
          }
        }
      }
    })
  });
  return server;
};
