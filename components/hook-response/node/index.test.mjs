import { strict as Assert } from "assert";
import { tmpdir } from "os";
import Http from "http";
import createApp from "express";
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

const listenAsync = (server, port) =>
  new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("listening", () => {
      const address = server.address();
      resolve(typeof address === "string" ? address : address.port);
    });
    server.listen(port);
  });

const closeAsync = (server) =>
  new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("close", resolve);
    server.close();
  });

const readAsync = (readable) =>
  new Promise((resolve, reject) => {
    const buffers = [];
    readable.on("error", reject);
    readable.on("data", (buffer) => {
      buffers.add(buffer);
    });
    readable.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
  });

const requestAsync = (request) =>
  new Promise((resolve, reject) => {
    request.end();
    request.on("error", reject);
    request.on("response", (response) => {
      readAsync(response).then((buffer) => {
        resolve({
          code: response.statusCode,
          message: response.statusMessage,
          body: buffer.toString("utf8"),
        });
      }, reject);
    });
  });

// Empty //
assertDeepEqual(
  await testHookAsync(
    hookResponse,
    unhookResponse,
    { hooks: { http: false }, "intercept-track-port": null },
    async () => {
      const server = Http.createServer();
      server.on("request", async (request, response) => {
        await readAsync(request);
        response.writeHead(200, "ok");
        response.end();
      });
      const port = await listenAsync(server, 0);
      assertDeepEqual(await requestAsync(Http.get({ port, path: "/path" })), {
        code: 200,
        message: "ok",
        body: "",
      });
      await closeAsync(server);
    },
  ),
  [],
);

// Express && http.createServer //
{
  const cleanupHeaders = (message) => {
    if (message[0] === "event" && message[4] === "response") {
      message[5].headers = null;
    }
    return message;
  };
  const makeJump = (index) => [
    ["event", "before", index, 0, "jump", null],
    ["event", "after", index, 0, "jump", null],
  ];
  assertDeepEqual(
    (
      await testHookAsync(
        hookResponse,
        unhookResponse,
        { hooks: { http: true } },
        async () => {
          const server = Http.createServer();
          const app = createApp();
          app.get("/route/*/:param1/:param2", function (req, res) {
            req.on("data", () => {});
            req.on("end", () => {
              res.send(JSON.stringify(req.params));
            });
          });
          server.on("request", app);
          const port = await listenAsync(server, 0);
          const request = get(
            `http://localhost:${String(port)}/route/foo/bar/qux`,
          );
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
          await closeAsync(server);
        },
      )
    ).map(cleanupHeaders),
    [
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
    ],
  );
}

// Track Port && http.Server //
{
  const port = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  assertDeepEqual(
    await testHookAsync(
      hookResponse,
      unhookResponse,
      { hooks: { http: false }, "intercept-track-port": port },
      async () => {
        const server = new Http.Server();
        server.on("request", async (request, response) => {
          await readAsync(request);
          response.writeHead(500, "forward");
          response.end();
        });
        await listenAsync(server, port);
        assertDeepEqual(
          await requestAsync(
            Http.get({
              socketPath: port,
              path: "/_appmap/bar",
            }),
          ),
          {
            code: 200,
            message: "ok",
            body: "",
          },
        );
        assertDeepEqual(
          await requestAsync(
            Http.get({
              socketPath: port,
              path: "/foo/bar",
            }),
          ),
          {
            code: 500,
            message: "forward",
            body: "",
          },
        );
        await closeAsync(server);
      },
    ),
    [{ method: "GET", path: "/bar", body: null }],
  );
}
