import { createServer } from "http";
import { strict as Assert } from "assert";
import { spawnSync } from "child_process";
import component from "./index.mjs";

const testAsync = (port, done) => {
  const server = createServer();
  server.listen(port);
  server.on("close", done);
  server.on("listening", () => {
    server.on("request", (request, response) => {
      let buffer = "";
      request.on("data", (data) => {
        buffer += data.toString("utf8");
      });
      request.on("end", () => {
        const { body, head } = JSON.parse(buffer);
        Assert.equal(typeof head, "string");
        Assert.equal(body, 123);
        response.end();
        server.close();
        setTimeout(close, 100);
      });
    });
    const { send, close } = component(
      {},
      {
        host: "localhost",
        port: typeof port === "string" ? port : server.address().port,
      },
    ).open();
    send(123);
  });
};

spawnSync("rm", ["tmp/sock", "-f"]);

testAsync(0, () => {
  testAsync("tmp/sock", () => {});
});
