import { createServer } from "net";
import { tmpdir } from "os";
import { mkdir } from "fs/promises";
import { strict as Assert } from "assert";
import { patch } from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Client from "./index.mjs";

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  fail: assertFail,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const {
  openClient,
  promiseClientTermination,
  closeClient,
  traceClient,
  listenClientAsync,
} = Client(dependencies);
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
  const client = openClient(
    extendConfiguration(
      createConfiguration("/cwd"),
      {
        "trace-port": server.address().port,
        "track-port": null,
      },
      null,
    ),
  );
  await listenClientAsync(client);
  traceClient(client, 123);
  client.socket.on("connect", () => {
    traceClient(client, 456);
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
  const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await mkdir(directory);
  const client = openClient(
    extendConfiguration(
      createConfiguration(directory),
      {
        "trace-port": "trace",
        "track-port": "track",
        "local-track-port": "local-track",
      },
      directory,
    ),
  );
  await listenClientAsync(client);
  try {
    await promiseClientTermination(client);
    assertFail();
  } catch ({ code }) {
    assertEqual(code, "ENOENT");
  }
}
