import { createServer } from "http2";
import { strict as Assert } from "assert";
import { spawnSync } from "child_process";
import component from "./index.mjs";

const testAsync = (port, done) => {
  const server = createServer();
  server.listen(port);
  server.on("close", done);
  server.on("listening", () => {
    server.on("stream", (stream, headers) => {
      let buffer = "";
      stream.on("data", (data) => {
        buffer += data.toString("utf8");
      });
      stream.on("end", () => {
        const { head, body } = JSON.parse(buffer);
        Assert.ok(typeof head, "string");
        Assert.equal(body, 123);
        stream.respond();
        stream.end();
        server.close();
        close();
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
