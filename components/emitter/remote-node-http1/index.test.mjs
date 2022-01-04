import { createServer } from "http";
import {
  getFreshTemporaryPath,
  assertEqual,
  assertDeepEqual,
  assertFail,
} from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Client from "./index.mjs";

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

const { createClient, executeClientAsync, interruptClient, traceClient } =
  Client(await buildTestDependenciesAsync(import.meta.url));
// happy path (unix-domain-socket) //
{
  let buffer = [];
  await testCaseAsync(
    getFreshTemporaryPath(),
    (body, response) => {
      buffer.push(body);
      response.writeHead(200);
      response.end();
    },
    async (port) => {
      const client = createClient({ host: "localhost", port });
      setTimeout(() => {
        traceClient(client, 123);
        interruptClient(client);
      });
      await executeClientAsync(client);
    },
  );
  assertDeepEqual(buffer, [{ head: "uuid", body: 123 }]);
}
// http echec status //
await testCaseAsync(
  0,
  (body, response) => {
    response.writeHead(400);
    response.end();
  },
  async (port) => {
    const client = createClient({ host: "localhost", port });
    setTimeout(() => {
      traceClient(client, 123);
    });
    try {
      await executeClientAsync(client);
      assertFail();
    } catch ({ message }) {
      assertEqual(message, "http1 echec status code: 400");
    }
  },
);
// non-empty response body //
await testCaseAsync(
  0,
  (body, response) => {
    response.writeHead(200);
    response.end("foo", "utf8");
  },
  async (port) => {
    const client = createClient({ host: "localhost", port });
    setTimeout(() => {
      traceClient(client, 123);
    });
    try {
      await executeClientAsync(client);
      assertFail();
    } catch ({ message }) {
      assertEqual(message, "non empty http1 response body");
    }
  },
);
