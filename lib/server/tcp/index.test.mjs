import { strict as Assert } from "assert";
import { connect } from "net";
import { tmpdir } from "os";
import { patch } from "net-socket-messaging";
import { buildAsync } from "../../../build/index.mjs";
import Server from "./index.mjs";

const testAsync = async () => {
  // happy path (unix domain socket) //
  {
    const port = `${tmpdir()}/appmap-server-tcp-${Math.random()
      .toString(36)
      .substring(2)}`;
    let resolveReception, resolveTermination;
    const reception = new Promise((resolve) => {
      resolveReception = resolve;
    });
    const termination = new Promise((resolve) => {
      resolveTermination = resolve;
    });
    const {
      initializeServerAsync,
      getServerPort,
      terminateServer,
      asyncServerTermination,
    } = Server({
      backend: {
        initializeBackend: () => "backend",
        sendBackend: (backend, data) => {
          Assert.equal(backend, "backend");
          Assert.equal(data, 123);
          resolveReception();
        },
        terminateBackend: (backend) => {
          Assert.equal(backend, "backend");
          resolveTermination();
        },
        asyncBackendTermination: (backend) => {
          Assert.equal(backend, "backend");
          return termination;
        },
      },
      ...(await buildAsync({ util: "default", log: "node", expect: "error" })),
    });
    const server = await initializeServerAsync({ port });
    const socket = connect(getServerPort(server));
    patch(socket);
    socket.send("123");
    await reception;
    terminateServer(server);
    await termination;
    await asyncServerTermination(server);
  }
  // unhappy path (port) //
  {
    let resolveInitialization, rejectTermination;
    const initialization = new Promise((resolve) => {
      resolveInitialization = resolve;
    });
    const termination = new Promise((resolve, reject) => {
      rejectTermination = reject;
    });
    const { initializeServerAsync, getServerPort, asyncServerTermination } =
      Server({
        backend: {
          initializeBackend: () => {
            resolveInitialization();
            return "backend";
          },
          sendBackend: () => {
            Assert.fail();
          },
          asyncBackendTermination: () => termination,
          terminateBackend: () => {
            rejectTermination(new Error("BOUM BACKEND"));
          },
        },
        ...(await buildAsync({
          util: "default",
          log: "node",
          expect: "error",
        })),
      });
    const server = await initializeServerAsync({ port: 0 });
    connect(getServerPort(server));
    await initialization;
    server.server.emit("error", new Error("BOUM SERVER"));
    try {
      await asyncServerTermination(server);
      Assert.fail();
    } catch ({ message }) {
      Assert.equal(message, "BOUM SERVER");
    }
    try {
      await termination;
    } catch ({ message }) {
      Assert.equal(message, "BOUM BACKEND");
    }
  }
};

testAsync();
