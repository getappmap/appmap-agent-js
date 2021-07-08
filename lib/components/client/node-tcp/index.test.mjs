import { createServer } from "net";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import { spawnSync } from "child_process";
import component from "./index.mjs";

const testAsync = (port, done) => {
  const server = createServer();
  server.listen(port);
  server.on("close", done);
  server.on("listening", () => {
    server.on("connection", (socket) => {
      socket.end();
      patch(socket);
      socket.on("message", (message) => {
        Assert.equal(message, "123");
        close();
        server.close();
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
