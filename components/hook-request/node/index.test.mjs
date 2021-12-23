import { assertDeepEqual } from "../../__fixture__.mjs";
import Http from "http";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookRequest from "./index.mjs";

const { createServer } = Http;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync, makeEvent } = await buildTestComponentAsync("hook");
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
    { hooks: { http: false } },
    async () => {
      await promiseResponse(Http.get(url));
    },
  ),
  { sources: [], events: [] },
);

const events = [
  makeEvent("begin", 1, 0, "bundle", null),
  makeEvent("before", 2, 0, "request", {
    protocol: "HTTP/1.1",
    method: "GET",
    url: "/path/?key=value",
    headers: { __proto__: null, host: `localhost:${String(port)}` },
  }),
  makeEvent("after", 2, 0, "request", {
    status: 200,
    message: "ok",
    headers: {
      "transfer-encoding": "chunked",
      connection: "close",
    },
  }),
  makeEvent("end", 1, 0, "bundle", null),
];

assertDeepEqual(
  await testHookAsync(
    hookRequest,
    unhookRequest,
    { hooks: { http: true } },
    async () => {
      await promiseResponse(Http.get(url));
    },
  ),
  { sources: [], events },
);

assertDeepEqual(
  await testHookAsync(
    hookRequest,
    unhookRequest,
    { hooks: { http: true } },
    async () => {
      const request = new Http.ClientRequest(url);
      request.end();
      await promiseResponse(request);
    },
  ),
  { sources: [], events },
);

await new Promise((resolve) => {
  server.on("close", resolve);
  server.close();
});
