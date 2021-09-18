import { strict as Assert } from "assert";
import { connect } from "net";
import { tmpdir } from "os";
import { mkdir, readdir } from "fs/promises";
import { createMessage } from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Server from "./index.mjs";

const {
  // deepEqual: assertDeepEqual,
  fail: assertFail,
  equal: assertEqual,
} = Assert;

const promisePresence = async (directory, filename) => {
  while (!(await readdir(directory)).includes(filename)) {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
};

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await mkdir(directory);
const configuration = createConfiguration("/cwd");

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const {
  openServerAsync,
  getServerPort,
  closeServer,
  promiseServerTermination,
} = Server(dependencies);
// happy path (unix domain socket) //
{
  const port = `${tmpdir()}/appmap-server-tcp-${Math.random()
    .toString(36)
    .substring(2)}`;
  const server = await openServerAsync({ port });
  setTimeout(() => {
    const socket = connect(getServerPort(server));
    socket.on("connect", () => {
      socket.write(
        createMessage(
          JSON.stringify([
            "initialize",
            extendConfiguration(configuration, {
              output: {
                directory,
              },
            }),
          ]),
        ),
      );
      socket.write(
        createMessage(
          JSON.stringify(["start", "track", { output: { filename: "foo" } }]),
        ),
      );
      socket.write(
        createMessage(
          JSON.stringify(["stop", "track", { errors: [], status: 0 }]),
        ),
      );
      socket.write(
        createMessage(
          JSON.stringify(["start", "track", { output: { filename: "bar" } }]),
        ),
      );
    });
  });
  await promisePresence(directory, "foo.appmap.json");
  setTimeout(() => {
    closeServer(server);
  });
  await promisePresence(directory, "bar.appmap.json");
  await promiseServerTermination(server);
}

// unhappy path (port) //
{
  const server = await openServerAsync({ port: 0 });
  setTimeout(() => {
    const socket = connect(getServerPort(server));
    socket.on("connect", () => {
      setTimeout(() => {
        server.server.emit("error", new Error("BOUM SERVER"));
      });
    });
  });
  try {
    await promiseServerTermination(server);
    assertFail();
  } catch ({ message }) {
    assertEqual(message, "BOUM SERVER");
  }
}
