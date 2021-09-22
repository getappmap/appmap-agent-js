import { createServer } from "net";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Client from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  fail: assertFail,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { openClient, promiseClientTermination, closeClient, sendClient } =
  Client(dependencies);
// happy path //
{
  const server = createServer();
  const buffer = [];
  server.on("connection", (socket) => {
    patch(socket);
    socket.on("message", (message) => {
      buffer.push(message);
    });
  });
  await new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(0);
  });
  const client = openClient({
    host: "localhost",
    port: server.address().port,
  });
  sendClient(client, 123);
  client.socket.on("connect", () => {
    sendClient(client, 456);
    closeClient(client);
  });
  await promiseClientTermination(client);
  assertDeepEqual(buffer, ["uuid", "123", "456"]);
  await new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });
}
// posix-domain-socket with error //
{
  const client = openClient({
    host: "localhost",
    port: `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
  });
  try {
    await promiseClientTermination(client);
    assertFail();
  } catch ({ code }) {
    assertEqual(code, "ENOENT");
  }
}
