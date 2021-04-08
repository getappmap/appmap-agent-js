
const {createServer} = require("http2");
import logger from "./logger.mjs";

// const onServerListening = function (error) {
//   logger.info("http2 Server listening on %j", this.address());
// };

const onServerError = function (error) {
  logger.error("http2 server error %s", error.stack);
}

const onStreamError = function (error) {
  logger.error("http2 stream error %s", error.stack);
};

export default (handle) => {
  const server = createServer();
  server.on("error", onServerError);
  server.on("stream", (stream, headers) => {
    logger.info("http2 request head: %j", headers);
    stream.setEncoding("utf8");
    stream.on("error", onStreamError);
    let input = "";
    stream.on("data", (data) => {
      input += data;
    });
    stream.on("end", () => {
      logger.info("http2 request body: %s", input);
      let output;
      const headers = {
        ":status": 200,
        "content-type": "application/json; charset=utf-8"
      };
      try {
        output = JSON.stringify(handle(JSON.parse(input)));
      } catch (error) {
        logger.error("Internal error %s", error.stack);
        headers[":status"] = 400;
        headers["content-type"] = "text/plain; charset=utf-8";
        output = error.message;
      }
      logger.info("http response: %j %s", headers, output);
      stream.respond(headers);
      stream.end(output, "utf8");
    });
  });
  return server;
};
