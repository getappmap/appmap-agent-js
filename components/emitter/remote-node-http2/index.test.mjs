import { createServer } from "http2";
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
    (body, stream) => {
      buffer.push(body);
      stream.respond({ ":status": 200 });
      stream.end();
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
  assertDeepEqual(buffer, [123]);
}
// http echec status //
await testCaseAsync(
  0,
  (body, stream) => {
    stream.respond({ ":status": 400 });
    stream.end();
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
      assertEqual(message, "http2 echec status code: 400");
    }
  },
);
// non-empty response body //
await testCaseAsync(
  0,
  (body, stream) => {
    stream.respond({ ":status": 200 });
    stream.write("unwanted-response-body", "utf8");
    stream.end();
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
      assertEqual(message, "non empty http2 response body");
    }
  },
);
