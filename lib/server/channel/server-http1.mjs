
const {createServer} = require("http");
import logger from "./logger.mjs";

const onServerListen = function (error) {
  logger.info("http1 Server listening on %j", this.address());
};

const onServerError = function (error) {
  logger.error("http1 server error %s", error.stack);
}

const onRequestError = function (error) {
  logger.error("http1 request error %s", error.stack);
};

const onResponseError = function (error) {
  logger.error("http1 response error %s", error.stack);
};

export default (port, handle) => {
  const server = createServer();
  server.on("error", onServerError);
  server.on("request", (request, response) => {
    logger.info("http request head: %s %s %j", request.method, request.path, request.headers);
    request.setEncoding("utf8");
    request.on("error", onRequestError);
    response.on("error", onResponseError);
    let input = "";
    request.on("data", (data) => {
      input += data;
    });
    request.on("end", () => {
      logger.info("http request body: %s", input);
      let status = 200;
      const headers = {
        "content-type": "application/json; charset=utf-8"
      };
      let output;
      try {
        output = JSON.stringify(handle(JSON.parse(input)));
      } catch (error) {
        logger.error("Internal error %s", error.stack);
        status = 400;
        output = error.message;
        headers["content-type"] = "text/plain; charset=utf-8"
      }
      logger.info("http response: %i %s", status, output);
      response.writeHead(status, headers);
      response.end(output, "utf8");
    });
  });
  if (Reflect.getOwnPropertyDescriptor(env, APPMAP_PORT) === undefined) {
    server.listen(null, onServerListen);
  } else {
    server.listen(env.APPMAP_PORT, onServerListen);
  }
  return server;
};
