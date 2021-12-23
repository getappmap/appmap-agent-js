import {
  assert,
  assertReject,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import { createServer, request as createRequest } from "http";
import { tmpdir } from "os";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Request from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { generateRespond, requestAsync } = Request(dependencies);

const listenServerAsync = (server, port) =>
  new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(port);
  });

const closeServerAsync = (server) =>
  new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });

// General //
{
  const server = createServer(
    generateRespond(async (method, path, body) => ({
      code: 200,
      message: "ok",
      body: { method, path, body },
    })),
  );
  await listenServerAsync(server, 0);
  assertDeepEqual(
    await requestAsync(
      "localhost",
      server.address().port,
      "GET",
      "/path",
      "body",
    ),
    {
      code: 200,
      message: "ok",
      body: {
        method: "GET",
        path: "/path",
        body: "body",
      },
    },
  );
  await closeServerAsync(server);
}

// Unix Domain Socket + Null Body //
{
  const server = createServer(
    generateRespond(async (method, path, body) => ({
      code: 200,
      message: "OK",
      body: null,
    })),
  );
  const port = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await listenServerAsync(server, port);
  assertDeepEqual(await requestAsync("localhost", port, "GET", "/path", null), {
    code: 200,
    message: "OK",
    body: null,
  });
  await closeServerAsync(server);
}

// Invalid Response Headers //
{
  const server = createServer((request, response) => {
    request.on("data", () => {});
    request.on("end", () => {});
    response.writeHead(200, "ok", {
      "content-length": 3,
      "content-type": "text/plain; charset=UTF-8",
    });
    response.end("foo", "utf8");
  });
  await listenServerAsync(server, 0);
  await assertReject(async () => {
    await requestAsync(
      "localhost",
      server.address().port,
      "GET",
      "/path",
      null,
    );
  });
  await closeServerAsync(server);
}

// Invalid Request Headers //
{
  const server = createServer(
    generateRespond(async (method, path, body) => {
      assert(false);
    }),
  );
  await listenServerAsync(server, 0);
  assertEqual(
    await new Promise((resolve, reject) => {
      const request = createRequest({
        host: "localhost",
        port: server.address().port,
        method: "GET",
        path: "/path",
        headers: {
          "content-length": 3,
          "content-type": "text/plain; charset=UTF-8",
        },
      });
      request.on("error", reject);
      request.end("foo", "utf8");
      request.on("response", (response) => {
        response.on("error", reject);
        response.on("data", () => {});
        response.on("end", () => {});
        resolve(response.statusCode);
      });
    }),
    400,
  );
  await closeServerAsync(server);
}
