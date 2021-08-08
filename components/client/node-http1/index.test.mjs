import { createServer } from "http";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Client from "./index.mjs";

const {
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  fail: assertFail,
} = Assert;

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

const testAsync = async () => {
  const { createClient, executeClientAsync, interruptClient, sendClient } =
    Client(await buildDependenciesAsync(import.meta.url, "test"));
  // happy path (unix-domain-socket) //
  {
    let buffer = [];
    await testCaseAsync(
      `${tmpdir()}/${Math.random().toString("36").substring(2)}`,
      (body, response) => {
        buffer.push(body);
        response.writeHead(200);
        response.end();
      },
      async (port) => {
        const client = createClient({ host: "localhost", port });
        setTimeout(() => {
          sendClient(client, 123);
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
        sendClient(client, 123);
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
        sendClient(client, 123);
      });
      try {
        await executeClientAsync(client);
        assertFail();
      } catch ({ message }) {
        assertEqual(message, "non empty http1 response body");
      }
    },
  );
};

testAsync();
