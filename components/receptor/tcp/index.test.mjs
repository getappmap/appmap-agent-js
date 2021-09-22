import { strict as Assert } from "assert";
import { connect } from "net";
import { tmpdir } from "os";
import { mkdir, readdir } from "fs/promises";
import { createMessage } from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Receptor from "./index.mjs";

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
  backend: { createBackend },
} = dependencies;
const {
  openReceptorAsync,
  getReceptorPort,
  closeReceptor,
  promiseReceptorTermination,
} = Receptor(dependencies);
// happy path (unix domain socket) //
{
  const port = `${tmpdir()}/appmap-server-tcp-${Math.random()
    .toString(36)
    .substring(2)}`;
  const server = await openReceptorAsync(createBackend(), { port });
  setTimeout(() => {
    const socket = connect(getReceptorPort(server));
    socket.on("connect", () => {
      socket.write(createMessage("session"));
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
          JSON.stringify([
            "start",
            "track",
            { path: null, options: { output: { basename: "foo" } } },
          ]),
        ),
      );
      socket.write(
        createMessage(
          JSON.stringify(["stop", "track", { errors: [], status: 0 }]),
        ),
      );
      socket.write(
        createMessage(
          JSON.stringify([
            "start",
            "track",
            { path: null, options: { output: { basename: "bar" } } },
          ]),
        ),
      );
    });
  });
  await promisePresence(directory, "foo.appmap.json");
  setTimeout(() => {
    closeReceptor(server);
  });
  await promisePresence(directory, "bar.appmap.json");
  await promiseReceptorTermination(server);
}

// unhappy path (port) //
{
  const server = await openReceptorAsync(createBackend(), { port: 0 });
  setTimeout(() => {
    const socket = connect(getReceptorPort(server));
    socket.on("connect", () => {
      setTimeout(() => {
        server.server.emit("error", new Error("BOUM SERVER"));
      });
    });
  });
  try {
    await promiseReceptorTermination(server);
    assertFail();
  } catch ({ message }) {
    assertEqual(message, "BOUM SERVER");
  }
}
