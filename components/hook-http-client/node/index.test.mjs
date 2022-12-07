import { assertDeepEqual } from "../../__fixture__.mjs";
import Http from "http";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookHttpClient from "./index.mjs";

const { Promise, String } = globalThis;

const { createServer } = Http;

const server = createServer();
server.on("request", (request, response) => {
  request.on("data", () => {});
  request.on("end", () => {});
  response.setHeader("connection", "close");
  response.removeHeader("date");
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.writeHead(200, "OK");
  response.end("123", "utf8");
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
    HookHttpClient,
    { configuration: { hooks: { http: false } } },
    async () => {
      await promiseResponse(Http.get(url));
    },
  ),
  [],
);

const events = [
  {
    type: "event",
    site: "begin",
    tab: 1,
    group: 0,
    time: 0,
    payload: {
      type: "bundle",
    },
  },
  {
    type: "event",
    site: "before",
    tab: 2,
    group: 0,
    time: 0,
    payload: {
      type: "request",
      side: "client",
      protocol: "HTTP/1.1",
      method: "GET",
      url: "/path/?key=value",
      route: null,
      headers: { host: `localhost:${String(port)}` },
      body: null,
    },
  },
  {
    type: "event",
    site: "after",
    tab: 2,
    group: 0,
    time: 0,
    payload: {
      type: "response",
      side: "client",
      status: 200,
      message: "OK",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "transfer-encoding": "chunked",
        connection: "close",
      },
      body: {
        type: "number",
        print: "123",
      },
    },
  },
  {
    type: "event",
    site: "end",
    tab: 1,
    group: 0,
    time: 0,
    payload: {
      type: "bundle",
    },
  },
];

assertDeepEqual(
  await testHookAsync(
    HookHttpClient,
    { configuration: { hooks: { http: true } } },
    async () => {
      await promiseResponse(Http.get(url));
    },
  ),
  events,
);

assertDeepEqual(
  await testHookAsync(
    HookHttpClient,
    { configuration: { hooks: { http: true } } },
    async () => {
      const request = new Http.ClientRequest(url);
      request.end();
      await promiseResponse(request);
    },
  ),
  events,
);

await new Promise((resolve) => {
  server.on("close", resolve);
  server.close();
});
