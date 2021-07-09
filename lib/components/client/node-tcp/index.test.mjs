import { createServer } from "net";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import component from "./index.mjs";

const testAsync = async () => {
  // happy path //
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0);
    server.on("error", reject);
    server.on("close", resolve);
    server.on("listening", () => {
      server.on("connection", (socket) => {
        patch(socket);
        socket.on("message", (message) => {
          Assert.equal(message, "123");
          close();
        });
      });
      const { life, send, close } = component(
        {},
        {
          host: "localhost",
          port: server.address().port,
        },
      ).open();
      send(123);
      life.then(() => {
        server.close();
      }, reject);
    });
  });
  // posix-domain-socket with error //
  const { life } = component({}, { host: "localhost", port: "missing" }).open();
  try {
    await life;
    Assert.fail();
  } catch (error) {
    Assert.equal(error.code, "ENOENT");
  }
};

testAsync().catch((error) => {
  throw error;
});
