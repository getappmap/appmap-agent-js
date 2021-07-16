import { createServer } from "http";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { getUniqueIdentifier } from "../../../util/index.mjs";
import component from "./index.mjs";

const testAsync = async (port, respond, runAsync) => {
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
  await new Promise((resolve, reject) => {
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

const assertThrowAsync = async (promise) => {
  let error = null;
  try {
    await promise;
  } catch (_error) {
    error = _error;
  }
  Assert.notEqual(error, null);
};

assertThrowAsync;

const testAllAsync = async () => {
  // happy path (unix-domain-socket) //
  {
    let resolve_reception;
    const reception = new Promise((resolve) => {
      resolve_reception = resolve;
    });
    testAsync(
      `${tmpdir()}/${getUniqueIdentifier()}`,
      ({ head, body }, response) => {
        Assert.equal(typeof head, "string");
        Assert.equal(body, 123);
        response.end();
        resolve_reception();
      },
      async (
        port,
        {
          initializeClient,
          terminateClient,
          awaitClientTermination,
          sendClient,
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
  testAsync(
    0,
    ({ head, body }, response) => {
      response.writeHead(400);
      response.end();
    },
    async (
      port,
      {
        initializeClient,
        terminateClient,
        awaitClientTermination,
        sendClient,
      },
    ) => {
      const client = initializeClient({ port });
      sendClient(client, 123);
      await assertThrowAsync(awaitClientTermination(client));
    },
  );
  // non-empty response body //
  testAsync(
    0,
    ({ head, body }, response) => {
      response.end("foo", "utf8");
    },
    async (
      port,
      {
        initializeClient,
        terminateClient,
        awaitClientTermination,
        sendClient,
      },
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
