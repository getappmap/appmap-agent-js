import { createServer } from "net";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import Client from "./index.mjs";

const testAsync = async () => {
  const {
    createClient,
    initializeClient,
    terminateClient,
    sendClient,
    asyncClientTermination,
  } = Client({});
  // happy path //
  {
    const server = createServer();
    await new Promise((resolve) => {
      server.on("listening", resolve);
      server.listen(0);
    });
    const client = createClient({
      host: "localhost",
      port: server.address().port,
    });
    initializeClient(client);
    const socket = await new Promise((resolve) => {
      server.on("connection", resolve);
    });
    patch(socket);
    socket.on("message", (message) => {
      Assert.equal(message, "123");
      terminateClient(client);
    });
    sendClient(client, 123);
    await asyncClientTermination(client);
    server.close();
  }
  // posix-domain-socket with error //
  {
    const client = createClient({
      host: "localhost",
      port: `${tmpdir()}/appmap-client-node-tcp-${Math.random()
        .toString(36)
        .substring(2)}`,
    });
    initializeClient(client);
    try {
      await asyncClientTermination(client);
      Assert.fail();
    } catch (error) {
      Assert.equal(error.code, "ENOENT");
    }
  }
};

testAsync();
