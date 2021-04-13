import logger from '../logger.mjs';

import { makeServer as makeHttp1Server } from './http1.mjs';
import { makeServer as makeHttp2Server } from './http2.mjs';
import { makeServer as makeHttp3Server } from './http3.mjs';
import { makeServer as makeMessagingServer } from './messaging.mjs';

const makers = {
  __proto__: null,
  http1: makeHttp1Server,
  http2: makeHttp2Server,
  http3: makeHttp3Server,
  messaging: makeMessagingServer,
};

const onServerListening = function onServerListening(error) {
  logger.info('Server listening on %j', this.address());
};

const onServerError = (error) => {
  logger.error('Server error %s', error.stack);
};

export const makeServer = (protocol, dispatcher, options) => {
  if (!(protocol in makers)) {
    logger.error(
      `Invalid protocol defaulting to 'messaging' and got: %s`,
      protocol,
    );
    protocol = 'messaging';
  }
  const server = makers[protocol](dispatcher, options);
  server.on('listening', onServerListening);
  server.on('error', onServerError);
  return server;
};
