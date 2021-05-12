
import {assert} from "../assert.mjs";
import * as Http1 from "./http1.mjs";
import * as Http2 from "./http2.mjs";
import * as Messaging from "./messaging.mjs";

const protocols = {
  http1: Http1,
  http2: Http2,
  messaging: Messaging
};

export const getProtocol = (protocol) => {
  assert(protocol in protocols, "invalid protocol %o", protocol);
  return protocols[protocol];
  // assert(protocol === "messaging" || protocol === "http1" || protocol === "http2", "invalid protocol: %o", protocol);
  // return import(`./${configuration.getProtocol()}.mjs`);
};
