
import { fork } from "child_process";
import { makeServer as createHttp11Server } from "./util/http-1-1.mjs";
import { makeServer as createHttp20Server } from "./util/http-2-0.mjs";
import { registerChild } from "./util/fork.mjs";

const makeServer = (env, dispatcher) => {
  if (Reflect.getOwnPropertyDescriptor(env, "APPMAP_HTTP_VERSION") === undefined) {
    logger.warning("Missing APPMAP_HTTP_VERSION: defaulting to 2.0");
    return createHttp20Server(dispatcher);
  }
  if (env.APPMAP_HTTP_VERSION === "2" || env.APPMAP_HTTP_VERSION === "2.0") {
    return createHttp20Server(dispatcher);
  }
  if (env.APPMAP_HTTP_VERSION === "1.1") {
    return createHttp11Server(dispatcher);
  }
  logger.warning("Unrecognized APPMAP_HTTP_VERSION: defaulting to 2.0, got: %s", env.APPMAP_HTTP_VERSION);
  return createHttp20Server(dispatcher);
};

export default = (env) => {
  const dispatcher = new Dispatcher(getDefaultConfig().extendWithEnv(env));
  const server = makeServer(env, dispatcher);
  const port = 8080;
  if (Reflect.getOwnPropertyDescriptor(env, "APPMAP_PORT") !== undefined) {
    port = env.APPMAP_PORT;
  }
  server.listen(port);
  return {
    server,
    fork:
  }
};
