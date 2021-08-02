import { strict as Assert } from "assert";
import { connect } from "net";
import { tmpdir } from "os";
import { patch } from "net-socket-messaging";
import { buildTestAsync } from "../../../build/index.mjs";
import Server from "./index.mjs";

const {
  // deepEqual: assertDeepEqual,
  fail: assertFail,
  equal: assertEqual,
} = Assert;

const testAsync = async () => {
  let resolve_open, resolve_close;
  const dependencies = {
    ...(await buildTestAsync(import.meta)),
    backend: {
      openBackend: () => {
        resolve_open();
        return [];
      },
      sendBackend: (backend, data) => backend.push(data),
      closeBackend: (backend) => {
        resolve_close(backend);
      },
    },
  };
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
      patch(socket);
      socket.send("123");
    });
    await new Promise((resolve) => {
      resolve_open = resolve;
    });
    setTimeout(() => {
      closeServer(server);
    });
    await promiseServerTermination(server);
    await new Promise((resolve) => {
      resolve_close = resolve;
    });
  }
  // unhappy path (port) //
  {
    const server = await openServerAsync({ port: 0 });
    setTimeout(() => {
      connect(getServerPort(server));
    });
    await new Promise((resolve) => {
      resolve_open = resolve;
    });
    setTimeout(() => {
      server.server.emit("error", new Error("BOUM SERVER"));
    });
    try {
      await promiseServerTermination(server);
      assertFail();
    } catch ({ message }) {
      assertEqual(message, "BOUM SERVER");
    }
    await new Promise((resolve) => {
      resolve_close = resolve;
    });
  }
};

testAsync();
