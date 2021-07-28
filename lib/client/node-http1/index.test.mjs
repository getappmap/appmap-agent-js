import { createServer } from "http";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Client from "./index.mjs";

const { notEqual: assertNotEqual, deepEqual: assertDeepEqual } = Assert;

const testCaseAsync = async (port, respond, runAsync) => {
  const server = createServer();
  server.on("request", (request, response) => {
    let buffer = "";
    request.on("data", (data) => {
      buffer += data.toString("utf8");
    });
    request.on("end", () => {
      respond(JSON.parse(buffer), response);
    });
  });
  await new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(port);
  });
  await runAsync(port === 0 ? server.address().port : port);
  await new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });
};

const assertThrowAsync = async (promise) => {
  let error = null;
  try {
    await promise;
  } catch (_error) {
    error = _error;
  }
  assertNotEqual(error, null);
};

const testAsync = async () => {
  const {
    initializeClient,
    terminateClient,
    sendClient,
    asyncClientTermination,
  } = Client(await buildTestAsync(import.meta));
  // happy path (unix-domain-socket) //
  {
    let resolve_reception;
    const reception = new Promise((resolve) => {
      resolve_reception = resolve;
    });
    testCaseAsync(
      `${tmpdir()}/appmap-client-node-http1-${Math.random()
        .toString(36)
        .substring(2)}`,
      (data, response) => {
        assertDeepEqual(data, { head: "uuid", body: 123 }), response.end();
        resolve_reception();
      },
      async (port) => {
        const client = initializeClient({ host: "localhost", port });
        sendClient(client, 123);
        await reception;
        terminateClient(client);
        await asyncClientTermination(client);
      },
    );
  }
  // http echec status //
  testCaseAsync(
    0,
    ({ head, body }, response) => {
      response.writeHead(400);
      response.end();
    },
    async (port) => {
      const client = initializeClient({ host: "localhost", port });
      sendClient(client, 123);
      await assertThrowAsync(asyncClientTermination(client));
    },
  );
  // non-empty response body //
  testCaseAsync(
    0,
    ({ head, body }, response) => {
      response.end("foo", "utf8");
    },
    async (port) => {
      const client = initializeClient({ host: "localhost", port });
      sendClient(client, 123);
      await assertThrowAsync(asyncClientTermination(client));
    },
  );
};

testAsync();
