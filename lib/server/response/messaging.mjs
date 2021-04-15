import { createServer } from 'net';
import { patch } from 'net-socket-messaging';
import logger from '../logger.mjs';

const onSocketError = (error) => {
  logger.error('Socket error: %s', error.stack);
};

export const makeServer = (dispatcher, options) => {
  const server = createServer(options);
  server.on('connection', (socket) => {
    socket.setNoDelay(true);
    socket.on('error', onSocketError);
    patch(socket);
    socket.on('message', (message) => {
      logger.info('messaging request: %s', message);
      let json;
      try {
        json = JSON.parse(message);
      } catch (error) {
        logger.error('Cannot JSON.parse message: %s', message, error.message);
        return socket.send(
          JSON.stringify({
            index: null,
            failure: error.message,
            success: null,
          }),
        );
      }
      if (Reflect.getOwnPropertyDescriptor(json, 'index') === undefined) {
        logger.error('Missing index field on %j', json);
        return socket.send(
          JSON.stringify({
            index: null,
            failure: 'Missing index field',
            success: null,
          }),
        );
      }
      if (Reflect.getOwnPropertyDescriptor(json, 'query') === undefined) {
        logger.error('Missing query field on %j', json);
        return socket.send(
          JSON.stringify({
            index: json.index,
            failure: 'Missing query field',
            success: null,
          }),
        );
      }
      let success;
      try {
        success = dispatcher.dispatch(json.query);
      } catch (error) {
        logger.error(`Error while handling %j\n%s`, json, error.stack);
        return socket.send(
          JSON.stringify({
            index: json.index,
            failure: error.message,
            success: null,
          }),
        );
      }
      if (json.index !== null) {
        logger.info(
          'messaging response: {index:%j, success:%j, failure: %j}',
          json.index,
          success,
          null,
        );
        return socket.send(
          JSON.stringify({
            index: json.index,
            success,
            failure: null,
          }),
        );
      }
      if (success !== null) {
        logger.error('Expected dispatcher to return null, got: %j', success);
        return socket.send(
          JSON.stringify({
            index: null,
            failure: `Query expected null as a response`,
            success: null,
          }),
        );
      }
      logger.info(
        'messaging response (not-transmitted): {index:null, success:null, failure: null}',
        json.index,
        success,
        null,
      );
      return null;
    });
  });
  return server;
};
