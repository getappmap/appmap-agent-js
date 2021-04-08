
import {createServer} from "http";
import logger from "./logger.mjs";

const onServerListen = function (error) {
  logger.info("http1 server listening on %j", this.address());
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

export const makeServer = (dispatcher) => {
  const server = createServer();
  server.on("error", onServerError);
  server.on("listening", onServerListening);
  server.on("request", (request, response) => {
    logger.info("http1 request head: %s %s %j", request.method, request.path, request.headers);
    request.setEncoding("utf8");
    response.setEncoding("utf8");
    request.on("error", onRequestError);
    response.on("error", onResponseError);
    let body1 = "";
    request.on("data", (data) => {
      body1 += data;
    });
    request.on("end", () => {
      logger.info("http1 request body: %s", body1);
      let status = 200;
      const headers = {
        "content-type": "application/json; charset=utf-8"
      };
      let body2;
      try {
        body2 = JSON.stringify(dispatcher.dispatch(JSON.parse(body1)));
      } catch (error) {
        logger.error("Error during handling of: %s \n%s", body1, error.stack);
        status = 400;
        body2 = error.message;
        headers["content-type"] = "text/plain; charset=utf-8";
      }
      logger.info("http response: %i %s", status, body2);
      response.writeHead(status, headers);
      response.end(body2);
    });
  });
  return server;
};
