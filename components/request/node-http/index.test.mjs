import { strict as Assert } from "assert";
import { createServer, request as createRequest } from "http";
import { tmpdir } from "os";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Request from "./index.mjs";

const {
  ok: assert,
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
  // fail: assertFail,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const {
  openResponder,
  listenResponderAsync,
  promiseResponderTermination,
  closeResponder,
  getResponderPort,
  requestAsync,
} = Request(dependencies);

// General //
{
  const responder = openResponder((method, path, body) => ({
    code: 200,
    message: "ok",
    body: { method, path, body },
  }));
  await listenResponderAsync(responder, 0);
  assertDeepEqual(
    await requestAsync(
      "localhost",
      getResponderPort(responder),
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
  closeResponder(responder);
  await promiseResponderTermination(responder);
}

// Unix Domain Socket + Null Body //
{
  const responder = openResponder((method, path, body) => ({
    code: 200,
    message: "ok",
    body: null,
  }));
  await listenResponderAsync(
    responder,
    `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
  );
  assertDeepEqual(
    await requestAsync(
      "localhost",
      getResponderPort(responder),
      "GET",
      "/path",
      null,
    ),
    {
      code: 200,
      message: "ok",
      body: null,
    },
  );
  closeResponder(responder);
  await promiseResponderTermination(responder);
}

// Invalid Response Headers //
{
  const server = createServer();
  await new Promise((resolve) => {
    server.listen(0);
    server.on("listening", resolve);
  });
  const { port } = server.address();
  server.on("request", (request, response) => {
    request.on("data", () => {});
    request.on("end", () => {});
    response.writeHead(200, "ok", {
      "content-length": 3,
      "content-type": "text/plain; charset=UTF-8",
    });
    response.end("foo", "utf8");
  });
  try {
    await requestAsync("localhost", port, "GET", "/path", null);
    assert(false);
  } catch (error) {
    assert(error instanceof Error);
  }
  await new Promise((resolve) => {
    server.close();
    server.on("close", resolve);
  });
}

// Invalid Request Headers //
{
  const responder = openResponder((method, path, body) => {
    assert(false);
  });
  await listenResponderAsync(responder, 0);
  assertDeepEqual(
    await new Promise((resolve, reject) => {
      const request = createRequest({
        host: "localhost",
        port: getResponderPort(responder),
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
  closeResponder(responder);
  await promiseResponderTermination(responder);
}
