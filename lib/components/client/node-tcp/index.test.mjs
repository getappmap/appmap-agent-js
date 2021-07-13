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
          terminateClient(handle);
        });
      });
      const { initializeClient, terminateClient, sendClient } = component(
        {},
        {
          host: "localhost",
          port: server.address().port,
        },
      );
      const client = initializeClient();
      sendClient(client, 123);
      checkClientTerminationAsync(client).then(() => {
        server.close();
      }, reject);
    });
  });
  // posix-domain-socket with error //
  {
    const { initializeClient } = component(
      {},
      { host: "localhost", port: "missing" },
    );
    const client = initializeClient();
    try {
      await checkClientTerminationAsync(client);
      Assert.fail();
    } catch (error) {
      Assert.equal(error.code, "ENOENT");
    }
  }
};

testAsync().catch((error) => {
  throw error;
});
