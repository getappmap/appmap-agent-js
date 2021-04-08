
import {createServer} from "http2";
import logger from "./logger.mjs";

const onServerListening = function (error) {
  logger.info("http2 Server listening on %j", this.address());
};

const onServerError = function (error) {
  logger.error("http2 server error %s", error.stack);
}

const onStreamError = function (error) {
  logger.error("http2 stream error %s", error.stack);
};

export const makeServer = (dispatcher) => {
  const server = createServer();
  server.on("error", onServerError);
  server.on("listening", onServerListening);
  server.on("stream", (stream, headers) => {
    logger.info("http2 request head: %j", headers);
    stream.setEncoding("utf8");
    stream.on("error", onStreamError);
    let body1 = "";
    stream.on("data", (data) => {
      body1 += data;
    });
    stream.on("end", () => {
      logger.info("http2 request body: %s", body1);
      let body2;
      const headers = {
        ":status": 200,
        "content-type": "application/json; charset=utf-8"
      };
      try {
        body2 = JSON.stringify(dispatcher.dispatch(JSON.parse(body1)));
      } catch (error) {
        logger.error("Error while processing %s\n%s", body1, error.stack);
        headers[":status"] = 400;
        body2 = error.message;
      }
      logger.info("http2 response %j %s", headers, body2);
      stream.respond(headers);
      stream.end(body2, "utf8");
    });
  });
  return server;
};
