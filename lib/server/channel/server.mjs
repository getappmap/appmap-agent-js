
import { fork } from "child_process";
import { makeServer as createHttp11Server } from "./util/http-1-1.mjs";
import { makeServer as createHttp20Server } from "./util/http-2-0.mjs";
import { registerChild } from "./util/fork.mjs";
import home from "../../../home.js";

export default = (env) => {
  env = {
    APPMAP_PORT: "8080",
    APPMAP_HTTP_VERSION: "1.1",
    ...env
  };
  const dispatcher = new Dispatcher(getDefaultConfig().extendWithEnv(env));
  let server;
  if (options.APPMAP_HTTP_VERSION === "1.1") {
    logger.info("Creating http/1.1 server");
    server = createHttp11Server(dispatcher);
  } else if (options.APPMAP_HTTP_VERSION === "2.0" || options.APPMAP_HTTP_VERSION === "2") {
    logger.info("Creating http/2.0 server");
    server = createHttp20Server(dispatcher);
  } else {
    logger.warning("Unrecognized APPMAP_HTTP_VERSION, defaulting to 1.1; expected either '1.1', '2.0', or '2' and got: %s", env.APPMAP_HTTP_VERSION);
    options.APPMAP_HTTP_VERSION = "1.1";
    server = createHttp11Server(dispatcher);
  }
  server.listen(env.APPMAP_PORT);
  return {
    server,
    fork: (path, argv, options) => {
      const ecma = "es2015";
      if (Reflect.getOwnPropertyDescriptor(options, "ecma") !== undefined) {
        if (options.ecma !== "es2015") {
          logger.warning("At the moment only options.ecma es2015 is supported, got: %s", options.ecma);
        }
      }
      const execArgv = [];
      if (Reflect.getOwnPropertyDescriptor(options, "esm") !== undefined && options.esm) {
        execArgv.push("--experimental-loader");
        if (Reflect.getOwnPropertyDescriptor(options, "cjs") !== undefined && options.cjs) {
          logger.info("Instrumenting both esm and cjs modules on %s", path);
          execArgv.push(Path.join(home, "client", ecma, "node", "main-both.js"));
        } else {
          logger.info("Instrumenting only esm modules on %s", path);
          execArgv.push(Path.join(home, "client", ecma, "node", "main-esm.js"));
        }
      } else if (Reflect.getOwnPropertyDescriptor(options, "cjs") !== undefined && options.cjs) {
        logger.info("Instrumenting only cjs modules on %s", path);
        execArgv.push("--require");
        execArgv.push(Path.join(home, "client", ecma, "node", "main-cjs.js"));
      } else {
        logger.warning("Not instrumenting anything because options.cjs and options.esm are both falsy");
      }
      if (Reflect.getOwnPropertyDescriptor(options, "execArgv") !== undefined) {
        execArgv.push(...options.execArgv);
      }
      const child = ChildProcess.fork(path, argv, {
        ...options,
        execArgv,
        env: {
          ...Reflect.getOwnPropertyDescriptor(options, "env") === undefined ? process.env : options.env,
          APPMAP_CHANNEL: "fork",
          APPMAP_HOST: "localhost",
          APPMAP_PORT: String(env.APPMAP_PORT),
          APPMAP_HTTP_VERSION: env.APPMAP_HTTP_VERSION,
        }
      });
      registerChild(child, dispatcher);
      return child;
    }
  }
};
