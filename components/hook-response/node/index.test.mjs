import { strict as Assert } from "assert";
import createApp from "express";
import Http from "http";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookResponse from "./index.mjs";

const { get } = Http;

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook");
const { hookResponse, unhookResponse } = HookResponse(dependencies);

const scenarioAsync = async (server) => {
  server.on("error", (error) => {
    throw error;
  });
  const app = createApp();
  app.get("/route/*/:param1/:param2", function (req, res) {
    req.on("data", () => {});
    req.on("end", () => {
      res.send(JSON.stringify(req.params));
    });
  });
  server.on("request", app);
  // server.on("request", (req, res) => {
  //   req.on("data", () => {});
  //   req.on("end", () => {
  //     res.end("null");
  //   });
  // });
  await new Promise((resolve) => {
    server.on("listening", resolve);
    server.listen(0);
  });
  const { port } = server.address();
  const request = get(`http://localhost:${String(port)}/route/foo/bar/qux`);
  const response = await new Promise((resolve) => {
    request.on("response", resolve);
  });
  let body = "";
  response.on("data", (data) => {
    body += data.toString("utf8");
  });
  await new Promise((resolve) => {
    response.on("end", resolve);
  });
  assertDeepEqual(JSON.parse(body), {
    0: "foo",
    param1: "bar",
    param2: "qux",
  });
  await new Promise((resolve) => {
    server.on("close", resolve);
    server.close();
  });
};

const cleanupHeaders = (message) => {
  if (message[0] === "event" && message[4] === "response") {
    message[5].headers = null;
  }
  return message;
};

assertDeepEqual(
  await testHookAsync(
    hookResponse,
    unhookResponse,
    { hooks: { http: false } },
    async () => {
      await scenarioAsync(Http.createServer());
    },
  ),
  [],
);

const makeJump = (index) => [
  ["event", "before", index, 0, "jump", null],
  ["event", "after", index, 0, "jump", null],
];

const trace = [
  [
    "event",
    "begin",
    1,
    0,
    "response",
    {
      protocol: "HTTP/1.1",
      method: "GET",
      headers: null,
      url: "/route/foo/bar/qux",
      route: null,
    },
  ],
  makeJump(2)[0],
  [
    "event",
    "begin",
    1,
    0,
    "response",
    {
      protocol: "HTTP/1.1",
      method: "GET",
      headers: null,
      url: "/route/foo/bar/qux",
      route: "/route/*/:param1/:param2",
    },
  ],
  makeJump(2)[1],
  ...makeJump(3),
  ...makeJump(4),
  ...makeJump(5),
  ...makeJump(6),
  [
    "event",
    "end",
    1,
    0,
    "response",
    {
      status: 200,
      message: "OK",
      headers: null,
    },
  ],
];

assertDeepEqual(
  (
    await testHookAsync(
      hookResponse,
      unhookResponse,
      { hooks: { http: true } },
      async () => {
        await scenarioAsync(Http.createServer());
      },
    )
  ).map(cleanupHeaders),
  trace,
);

assertDeepEqual(
  (
    await testHookAsync(
      hookResponse,
      unhookResponse,
      { hooks: { http: true } },
      async () => {
        await scenarioAsync(new Http.Server());
      },
    )
  ).map(cleanupHeaders),
  trace,
);
