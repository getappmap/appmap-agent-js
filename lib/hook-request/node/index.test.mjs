import { strict as Assert } from "assert";
import Http from "http";
import { buildTestAsync } from "../../../src/build.mjs";
import HookRequest from "./index.mjs";

const { createServer } = Http;

// const require = Module.createRequire(import.meta.url);
// const Http = require("http");

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({ ...import.meta, deps: ["hook"] });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookRequest, unhookRequest } = HookRequest(dependencies);

  const server = createServer();
  server.on("request", (request, response) => {
    request.on("data", () => {});
    request.on("end", () => {});
    response.removeHeader("date");
    response.writeHead(200, "ok");
    response.end();
  });
  server.on("error", (error) => {
    throw error;
  });
  await new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(0);
  });
  const { port } = server.address();

  const url = `http://localhost:${String(port)}/path/?key=value#hash`;

  const promiseResponse = (request) =>
    new Promise((resolve) => {
      request.on("response", (response) => {
        response.on("data", () => {});
        response.on("end", resolve);
      });
    });

  assertDeepEqual(
    await testHookAsync(
      hookRequest,
      unhookRequest,
      { conf: { hooks: { http: false } } },
      async () => {
        await promiseResponse(Http.get(url));
      },
    ),
    [],
  );

  const trace = [
    {
      type: "send",
      data: {
        type: "event",
        data: {
          type: "before",
          index: 1,
          data: {
            type: "request",
            protocol: "HTTP/1.1",
            method: "GET",
            url: "/path/?key=value",
            headers: { __proto__: null, host: `localhost:${String(port)}` },
          },
          group: 0,
          time: 0,
        },
      },
    },
    {
      type: "send",
      data: {
        type: "event",
        data: {
          type: "after",
          index: 1,
          data: {
            type: "request",
            status: 200,
            message: "ok",
            headers: {
              "transfer-encoding": "chunked",
              connection: "close",
            },
          },
          group: 0,
          time: 0,
        },
      },
    },
  ];

  assertDeepEqual(
    await testHookAsync(
      hookRequest,
      unhookRequest,
      { conf: { hooks: { http: true } } },
      async () => {
        await promiseResponse(Http.get(url));
      },
    ),
    trace,
  );

  assertDeepEqual(
    await testHookAsync(
      hookRequest,
      unhookRequest,
      { conf: { hooks: { http: true } } },
      async () => {
        const request = new Http.ClientRequest(url);
        request.end();
        await promiseResponse(request);
      },
    ),
    trace,
  );

  await new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });
};

testAsync();
