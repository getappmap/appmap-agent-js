import Http from "http";
import createApp from "express";
import {
  assertDeepEqual,
  getFreshTemporaryURL,
  convertPort,
} from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookResponse from "./index.mjs";

const { get } = Http;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync, makeEvent } = await buildTestComponentAsync("hook");
const { hookResponse, unhookResponse } = HookResponse(dependencies);

const listenAsync = (server, port) =>
  new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("listening", () => {
      resolve(port === 0 ? server.address().port : port);
    });
    server.listen(convertPort(port));
  });

const promiseCycleClosing = async (request, response) =>
  await Promise.all([
    new Promise((resolve) => {
      response.on("close", resolve);
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
    {
      recorder: "process",
      hooks: { http: false },
    },
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
  { sources: [], events: [] },
);

// Express && http.createServer //
{
  const cleanupHeaders = ({
    type,
    index,
    time,
    data: { type: data_type, ...data_rest },
  }) => {
    if (data_type === "response") {
      data_rest.headers = null;
    }
    return makeEvent(type, index, time, data_type, data_rest);
  };
  const makeJump = (index) => [
    makeEvent("before", index, 0, "jump", null),
    makeEvent("after", index, 0, "jump", null),
  ];
  const events = (
    await testHookAsync(
      hookResponse,
      unhookResponse,
      { recorder: "process", hooks: { http: true } },
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
        assertDeepEqual(JSON.parse(body), {
          0: "foo",
          param1: "bar",
          param2: "qux",
        });
        await closeAsync(server);
      },
    )
  ).events.map(cleanupHeaders);
  assertDeepEqual(
    [...events.slice(0, 4), events[events.length - 1]],
    [
      makeEvent("begin", 1, 0, "response", {
        protocol: "HTTP/1.1",
        method: "GET",
        headers: null,
        url: "/route/foo/bar/qux",
        route: null,
      }),
      makeJump(2)[0],
      makeEvent("begin", 1, 0, "response", {
        protocol: "HTTP/1.1",
        method: "GET",
        headers: null,
        url: "/route/foo/bar/qux",
        route: "/route/*/:param1/:param2",
      }),
      makeJump(2)[1],
      makeEvent("end", 1, 0, "response", {
        status: 200,
        message: "OK",
        headers: null,
      }),
    ],
  );
}

// Track Port && http.Server //
{
  const port = getFreshTemporaryURL();
  assertDeepEqual(
    await testHookAsync(
      hookResponse,
      unhookResponse,
      {
        recorder: "remote",
        hooks: { http: false },
        "intercept-track-port": "^",
      },
      async () => {
        const server = new Http.Server();
        server.on("request", async (request, response) => {
          await readAsync(request);
          response.writeHead(500, "forward");
          response.end();
        });
        await listenAsync(server, port);
        // assertDeepEqual(
        //   await requestAsync(
        //     Http.get({
        //       socketPath: port,
        //       path: "/_appmap/bar",
        //     }),
        //   ),
        //   {
        //     code: 200,
        //     message: "ok",
        //     body: "",
        //   },
        // );
        assertDeepEqual(
          await requestAsync(
            Http.get({
              socketPath: convertPort(port),
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
    {
      sources: [],
      events: [],
    },
  );
}
