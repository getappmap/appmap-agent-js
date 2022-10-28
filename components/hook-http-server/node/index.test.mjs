import Http from "http";
import createApp from "express";
import { assertDeepEqual, assertReject } from "../../__fixture__.mjs";
import {
  toIpcPath,
  getTmpUrl,
  convertFileUrlToPath,
} from "../../path/index.mjs?env=test";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookHttpServer from "./index.mjs?env=test";

const {
  Promise,
  Buffer,
  JSON: { stringify: stringifyJSON, parse: parseJSON },
  String,
} = globalThis;

const { get } = Http;

const listenAsync = (server, port) =>
  new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("listening", () => {
      resolve(port === 0 ? server.address().port : port);
    });
    server.listen(
      typeof port === "number" ? port : toIpcPath(convertFileUrlToPath(port)),
    );
  });

const promiseCycleClosing = async (request, response) =>
  await Promise.all([
    new Promise((resolve) => {
      request.on("close", resolve);
    }),
    new Promise((resolve) => {
      response.on("close", resolve);
    }),
  ]);

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
      buffers.push(buffer);
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

// Invalid Track Port //
assertReject(
  testHookAsync(
    HookHttpServer,
    {
      configuration: {
        "intercept-track-port": ")(",
        recorder: "process",
        hooks: { http: true },
      },
    },
    async () => {},
  ),
  /^ExternalAppmapError: intercept-track-port is not a regexp$/u,
);

// Empty //
assertDeepEqual(
  await testHookAsync(
    HookHttpServer,
    {
      configuration: {
        recorder: "process",
        hooks: { http: false },
      },
    },
    async () => {
      const server = Http.createServer();
      server.on("request", async (request, response) => {
        await readAsync(request);
        response.writeHead(200, "OK");
        response.end();
      });
      const port = await listenAsync(server, 0);
      assertDeepEqual(await requestAsync(Http.get({ port, path: "/path" })), {
        code: 200,
        message: "OK",
        body: "",
      });
      await closeAsync(server);
    },
  ),
  [],
);

// Express && http.createServer //
{
  const cleanupHeaders = (event) => {
    if (event.payload.type === "request" || event.payload.type === "response") {
      return {
        ...event,
        payload: {
          ...event.payload,
          headers: {},
        },
      };
    } else {
      return event;
    }
  };
  const events = (
    await testHookAsync(
      HookHttpServer,
      { configuration: { recorder: "process", hooks: { http: true } } },
      async () => {
        const server = Http.createServer();
        const app = createApp();
        app.get("/route/*/:param1/:param2", function (req, res) {
          res.setHeader("content-type", "application/json; charset=utf-8");
          req.on("data", () => {});
          req.on("end", () => {
            res.send(stringifyJSON(req.params));
          });
        });
        server.on("request", app);
        // Manufacture activity after closing both request and response
        server.on("request", async (request, response) => {
          await promiseCycleClosing(request, response);
          response.emit("foo");
        });
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
        await promiseCycleClosing(request, response);
        assertDeepEqual(parseJSON(body), {
          0: "foo",
          param1: "bar",
          param2: "qux",
        });
        await closeAsync(server);
      },
    )
  ).map(cleanupHeaders);
  assertDeepEqual(
    [...events.slice(0, 4), events[events.length - 1]],
    [
      {
        type: "event",
        site: "begin",
        tab: 1,
        group: 0,
        time: 0,
        payload: {
          type: "request",
          side: "server",
          protocol: "HTTP/1.1",
          method: "GET",
          url: "/route/foo/bar/qux",
          route: null,
          headers: {},
          body: null,
        },
      },
      {
        type: "event",
        site: "before",
        tab: 2,
        group: 0,
        time: 0,
        payload: {
          type: "jump",
        },
      },
      {
        type: "amend",
        site: "begin",
        tab: 1,
        payload: {
          type: "request",
          side: "server",
          protocol: "HTTP/1.1",
          method: "GET",
          url: "/route/foo/bar/qux",
          route: "/route/*/:param1/:param2",
          headers: {},
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
          type: "jump",
        },
      },
      {
        type: "event",
        site: "end",
        tab: 1,
        group: 0,
        time: 0,
        payload: {
          type: "response",
          side: "server",
          status: 200,
          message: "OK",
          headers: {},
          body: {
            type: "object",
            print: "[object Object]",
            index: 1,
            constructor: "Object",
            specific: {
              type: "hash",
              length: 3,
              properties: {
                0: "String",
                param1: "String",
                param2: "String",
              },
            },
          },
        },
      },
    ],
  );
}

// Track Port && http.Server //
{
  const port = toAbsoluteUrl(getUuid(), getTmpUrl());
  assertDeepEqual(
    await testHookAsync(
      HookHttpServer,
      {
        configuration: {
          recorder: "remote",
          hooks: { http: false },
          "intercept-track-port": "^",
        },
      },
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
              socketPath: toIpcPath(convertFileUrlToPath(port)),
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
    [],
  );
}
