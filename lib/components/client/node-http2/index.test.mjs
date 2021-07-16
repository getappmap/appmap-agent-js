import { createServer } from "http2";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { getUniqueIdentifier } from "../../../util/index.mjs";
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
  await runAsync(port === 0 ? server.address().port : port, component({}));
  await new Promise((resolve, reject) => {
    server.on("close", resolve);
    server.on("error", reject);
    server.close();
  });
};

const testAllAsync = async () => {
  // happy path (unix-domain-socket) //
  {
    let resolve_reception;
    const reception = new Promise((resolve) => {
      resolve_reception = resolve;
    });
    await testAsync(
      `${tmpdir()}/${getUniqueIdentifier()}`,
      (body, stream) => {
        Assert.equal(body, 123);
        stream.respond({ ":status": 200 });
        stream.end();
        resolve_reception();
      },
      async (
        port,
        {
          initializeClient,
          terminateClient,
          sendClient,
          awaitClientTermination,
        },
      ) => {
        const client = initializeClient({ port });
        sendClient(client, 123);
        await reception;
        terminateClient(client);
        await awaitClientTermination(client);
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
    async (
      port,
      { initializeClient, sendClient, awaitClientTermination },
    ) => {
      const client = initializeClient({ port });
      sendClient(client, 123);
      await assertThrowAsync(awaitClientTermination(client));
    },
  );
  // non-empty response body //
  await testAsync(
    0,
    (body, stream) => {
      stream.respond({ ":status": 200 });
      stream.end("foo", "utf8");
    },
    async (
      port,
      { initializeClient, sendClient, awaitClientTermination },
    ) => {
      const client = initializeClient({ port });
      sendClient(client, 123);
      await assertThrowAsync(awaitClientTermination(client));
    },
  );
};

testAllAsync().catch((error) => {
  throw error;
});
