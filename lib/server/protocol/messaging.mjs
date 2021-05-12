import Net from 'net';
import NetSocketMessaging from 'net-socket-messaging';
import {logger} from "../logger.mjs";
import {Left, Right, toEither} from "../either.mjs";

const wrapNullHead = (body) => ({
  head: null,
  body,
});

const verify = (json) => {
  if (Reflect.getOwnPropertyDescriptor(json, 'head') === undefined) {
    return new Left({head:null, body:"missing head field"});
  }
  if (Reflect.getOwnPropertyDescriptor(json, 'body') === undefined) {
    return new Left({head:json.head, body:"missing body field"});
  }
  return new Right(json);
};

export const createServer = (options) => Net.createServer(options);

export const attach = (server, {dispatchAsync}) => {
  const respondAsync = ({head, body}) => dispatchAsync(body).then((either) => either.mapBoth((body) => ({
    head,
    body
  })));
  server.on('connection', (socket) => {
    socket.setNoDelay(true);
    const send = (message) => {
      logger.debug("respond: %j", message);
      socket.send(JSON.stringify(message));
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
    NetSocketMessaging.patch(socket);
    socket.on('message', (message) => {
      logger.debug("receive: %j", message);
      toEither(JSON.parse, "failed to parse json message", message).mapLeft(wrapNullHead).bind(verify).bindAsync(respondAsync).then(sendEither);
    });
  });
};
