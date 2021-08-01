import { createServer } from "net";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import Client from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  fail: assertFail,
} = Assert;

const testAsync = async () => {
  const { createClient, executeClientAsync, interruptClient, sendClient } =
    Client({});
  // happy path //
  {
    const server = createServer();
    const buffer = [];
    server.on("connection", (socket) => {
      patch(socket);
      socket.on("message", (message) => {
        buffer.push(JSON.parse(message));
      });
    });
    await new Promise((resolve) => {
      server.on("listening", resolve);
      server.listen(0);
    });
    const client = createClient({
      host: "localhost",
      port: server.address().port,
    });
    setTimeout(() => {
      sendClient(client, 123);
      interruptClient(client);
    });
    await executeClientAsync(client);
    assertDeepEqual(buffer, [123]);
    await new Promise((resolve) => {
      server.on("close", resolve);
      server.close();
    });
  }
  // posix-domain-socket with error //
  {
    const client = createClient({
      host: "localhost",
      port: `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
    });
    try {
      await executeClientAsync(client);
      assertFail();
    } catch ({ code }) {
      assertEqual(code, "ENOENT");
    }
  }
};

testAsync();
