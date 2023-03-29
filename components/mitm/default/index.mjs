import { createServer as createHttpServer } from "node:http";
import { WebSocketServer } from "ws";
import { createPool, addPool, closePool } from "../../pool/index.mjs";
import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import {
  partialx_,
  partialx__,
  partialx___,
  partialxx___,
  partialxx____,
  partialxxx___,
  partialxxx____,
} from "./util.mjs";
import {
  interceptRequest,
  interceptConnect,
  interceptUpgrade,
} from "./intercept.mjs";
import { requestProxy, upgradeProxy, connectProxy } from "./proxy.mjs";

const { Promise, Map } = globalThis;

export const openMitmAsync = async (configuration, backend) => {
  assert(
    configuration["proxy-port"] !== null,
    "cannot open mitm because it is disabled",
    InternalAppmapError,
  );
  const wss = new WebSocketServer({ noServer: true });
  const proxy = createHttpServer();
  const handlers = {
    request: partialxx___(interceptRequest, configuration, backend),
    connect: partialxx____(interceptConnect, configuration, backend),
    upgrade: partialxxx____(interceptUpgrade, configuration, backend, wss),
  };
  const pool = createPool();
  const servers = new Map();
  proxy.on("connection", partialx_(addPool, pool));
  proxy.on("request", partialx__(requestProxy, handlers.request));
  proxy.on("upgrade", partialx___(upgradeProxy, handlers.upgrade));
  proxy.on("connect", partialxxx___(connectProxy, handlers, servers, pool));
  proxy.listen(configuration["proxy-port"]);
  await new Promise((resolve, reject) => {
    proxy.on("error", reject);
    proxy.on("listening", resolve);
  });
  return { proxy, servers, pool };
};

export const getMitmPort = ({ proxy }) => proxy.address().port;

export const closeMitmAsync = async ({ proxy, servers, pool }) => {
  const promises = [proxy, ...servers.values()].map((server) => {
    server.close();
    return new Promise((resolve, reject) => {
      server.on("error", reject);
      server.on("close", resolve);
    });
  });
  closePool(pool, 1000);
  await Promise.all(promises);
};
