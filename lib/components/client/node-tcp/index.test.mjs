import { createServer } from "net";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import { getUniqueIdentifier } from "../../../util/index.mjs";
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
          terminateClient(client);
        });
      });
      const {
        initializeClient,
        terminateClient,
        sendClient,
        awaitClientTermination,
      } = component({});
      const client = initializeClient({ port: server.address().port });
      sendClient(client, 123);
      awaitClientTermination(client).then(() => {
        server.close();
      }, reject);
    });
  });
  // posix-domain-socket with error //
  {
    const { initializeClient, awaitClientTermination } = component({});
    const client = initializeClient({
      port: `${tmpdir()}/${getUniqueIdentifier()}`,
    });
    try {
      await awaitClientTermination(client);
      Assert.fail();
    } catch (error) {
      Assert.equal(error.code, "ENOENT");
    }
  }
};

testAsync().catch((error) => {
  throw error;
});
