import { createServer } from "http2";
import { spawnSync } from "child_process";
import { strict as Assert } from "assert";
import component from "./index.mjs";

const assertThrowAsync = async (promise) => {
  let error = null;
  try {
    await promise;
  } catch (_error) {
    error = _error;
  }
  Assert.notEqual(error, null);
};

const testAsync = async (port, respond, runAsync) => {
  const server = createServer();
  server.on("stream", (stream) => {
    let buffer = "";
    stream.on("data", (data) => {
      buffer += data.toString("utf8");
    });
    stream.on("end", () => {
      respond(JSON.parse(buffer), stream);
    });
  });
  await new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(port);
  });
  await runAsync(
    component(
      {},
      {
        host: "localhost",
        port: port === 0 ? server.address().port : port,
      },
    ),
  );
  await new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });
};

const testAllAsync = async () => {
  // happy path (unix-domain-socket) //
  {
    spawnSync("rm", ["tmp/sock", "-f"]);
    let resolve_reception;
    const reception = new Promise((resolve) => {
      resolve_reception = resolve;
    });
    await testAsync(
      "tmp/sock",
      (body, stream) => {
        Assert.equal(body, 123);
        stream.respond({ ":status": 200 });
        stream.end();
        resolve_reception();
      },
      async ({ initializeClient, terminateClient, sendClient }) => {
        const { termination, handle } = initializeClient();
        sendClient(handle, 123);
        await reception;
        terminateClient(handle);
        await termination;
      },
    );
  }
  // http echec status //
  await testAsync(
    0,
    (body, stream) => {
      stream.respond({ ":status": 400 });
      stream.end();
    },
    async ({ initializeClient, terminateClient, sendClient }) => {
      const { termination, handle } = initializeClient();
      sendClient(handle, 123);
      await assertThrowAsync(termination);
    },
  );
  // non-empty response body //
  await testAsync(
    0,
    (body, stream) => {
      stream.respond({ ":status": 200 });
      stream.end("foo");
    },
    async ({ initializeClient, terminateClient, sendClient }) => {
      const { termination, handle } = initializeClient();
      sendClient(handle, 123);
      await assertThrowAsync(termination);
    },
  );
  // onRequestError //
  await testAsync(
    0,
    (body, stream) => {
      Assert.fail();
    },
    async ({ initializeClient, terminateClient, sendClient }) => {
      const {
        termination,
        handle: { onRequestError },
      } = initializeClient();
      onRequestError(new Error("BOUM"));
      await assertThrowAsync(termination);
    },
  );
  // onRequestError //
  await testAsync(
    0,
    (body, stream) => {
      Assert.fail();
    },
    async ({ initializeClient, terminateClient, sendClient }) => {
      const {
        termination,
        handle: { onRequestFrameError },
      } = initializeClient();
      onRequestFrameError("type", "code", "id");
      await assertThrowAsync(termination);
    },
  );
};

testAllAsync().catch((error) => {
  throw error;
});
