import { createServer } from 'net';
import { patch } from 'net-socket-messaging';

const wrapNullHead = (body) => ({
  head: null,
  body,
});

const promiseLeft = (any) => Promise.resolve(new Left(any));

export const makeServer = (dispatcher, options) => {
  const dispatchAsync = async ({head, body}) => ({
    head,
    body: await dispatcher.dispatchAsync(body);
  });
  const server = createServer(options);
  server.on('connection', (socket) => {
    socket.setNoDelay(true);
    const send = (message) => {
      logger.debug("respond >> %s", message);
      socket.send(message);
    };
    const sendLeft = ({head, body}) => {
      send({
        head,
        type: "left",
        body
      });
    }
    const sendRight = ({head, body}) => {
      if (head !== null) {
        send({
          head,
          type: "right",
          body
        });
      } else if (body !== null) {
        send({
          head,
          type: "left",
          body: `expected a null result but got: ${JSON.stringify(body)}`
        });
      }
    };
    const sendEither = (either) => {
      either.either(
        sendLeft,
        sendRight
      );
    };
    patch(socket);
    socket.on('message', (message) => {
      logger.debug("receive >> %s", message);
      toEither(JSON.parse, "failed to parse json message", message).mapLeft(wrapNullHead).bind((json) => {
        if (Reflect.getOwnPropertyDescriptor(json, 'head') === undefined) {
          return new Left({head:null, body:"missing head field"});
        }
        if (Reflect.getOwnPropertyDescriptor(json, 'body') === undefined) {
          return new Left({head:json.index, body:"missing body field"});
        }
        return new Right(json);
      }).bindAsync(dispatchAsync).then(sendEither);
    });
  });
  return server;
};
