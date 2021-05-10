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

export const makeServer = (protocol, dispatching, options) => makers[protocol](dispatching, options);
