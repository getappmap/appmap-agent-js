import { createServer as createTCPServer } from "net";
// import { createServer as createHTTPServer } from "http";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import NetSocketMessaging from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Emitter from "./index.mjs";

const { patch: patchSocket } = NetSocketMessaging;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
  // fail: assertFail,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const listenServerAsync = (server, port) =>
  new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(port);
  });

const closeServerAsync = (server) =>
  new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });

const {
  openEmitter,
  closeEmitter,
  sendEmitter,
  // requestRemoteEmitterAsync,
} = Emitter(dependencies);

// happy path //
{
  const testAsync = async (port) => {
    const server = createTCPServer();
    const buffer = [];
    server.on("connection", (socket) => {
      patchSocket(socket);
      socket.on("message", (message) => {
        buffer.push(message);
      });
      socket.on("close", () => {
        assertDeepEqual(buffer, [
          "uuid",
          JSON.stringify(configuration),
          "123",
          "456",
        ]);
        server.close();
      });
    });
    await listenServerAsync(server, port);
    const configuration = extendConfiguration(
      createConfiguration("/cwd"),
      {
        "trace-port": port === 0 ? server.address().port : port,
        "track-port": 0,
      },
      null,
    );
    const emitter = openEmitter(configuration);
    sendEmitter(emitter, 123);
    closeEmitter(emitter);
    sendEmitter(emitter, 456);
    await closeServerAsync(server);
  };
  await testAsync(0);
  await testAsync(`${tmpdir()}/${Math.random().toString(36).substring(2)}`);
}
