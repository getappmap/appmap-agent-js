import { strict as Assert } from "assert";
import { connect } from "net";
import { tmpdir } from "os";
import { patch } from "net-socket-messaging";
import {
  createExposedPromise,
  getUniqueIdentifier,
} from "../../../util/index.mjs";
import component from "./index.mjs";

const testAsync = async () => {
  // happy path (unix domain socket) //
  {
    const port = `${tmpdir()}/${getUniqueIdentifier()}`;
    const reception = createExposedPromise();
    const termination = createExposedPromise();
    const { initializeServerAsync, terminateServer, promiseServerTermination } =
      component({
        Backend: {
          initializeBackend: () => "backend",
          sendBackend: (backend, data) => {
            Assert.equal(backend, "backend");
            Assert.equal(data, 123);
            reception.resolve();
          },
          terminateBackend: (backend) => {
            Assert.equal(backend, "backend");
            termination.resolve();
          },
          awaitBackendTermination: (backend) => {
            Assert.equal(backend, "backend");
            return termination.promise;
          },
        },
      });
    const server = await initializeServerAsync({ port });
    const socket = connect(port);
    patch(socket);
    socket.send("123");
    await reception.promise;
    terminateServer(server);
    await termination.promise;
    await promiseServerTermination(server);
  }
  // unhappy path (port) //
  {
    const initialization = createExposedPromise();
    const termination = createExposedPromise();
    const { initializeServerAsync, promiseServerTermination } = component({
      Backend: {
        initializeBackend: () => {
          initialization.resolve();
          return "backend";
        },
        sendBackend: () => {
          Assert.fail();
        },
        awaitBackendTermination: () => termination.promise,
        terminateBackend: () => {
          termination.reject(new Error("BOUM BACKEND"));
        },
      },
    });
    const server = await initializeServerAsync({ port: 0 });
    const { port } = server.server.address();
    connect(port);
    await initialization.promise;
    server.server.emit("error", new Error("BOUM SERVER"));
    try {
      await promiseServerTermination(server);
      Assert.fail();
    } catch (error) {
      Assert.equal(error.message, "BOUM SERVER");
    }
    try {
      await termination.promise;
    } catch (error) {
      Assert.equal(error.message, "BOUM BACKEND");
    }
  }
};

testAsync().catch((error) => {
  throw error;
});
