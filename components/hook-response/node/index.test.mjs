import { strict as Assert } from "assert";
import createApp from "express";
import Http from "http";
import { buildTestAsync } from "../../build.mjs";
import HookResponse from "./index.mjs";

const { get } = Http;

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({ ...import.meta, deps: ["hook"] });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookResponse, unhookResponse } = HookResponse(dependencies);

  const scenarioAsync = async (server) => {
    server.on("error", (error) => {
      throw error;
    });
    const app = createApp();
    app.get("/route/*/:param1/:param2", function (req, res) {
      res.send(JSON.stringify(req.params));
    });
    server.on("request", app);
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

  const cleanupHeaders = (trace) =>
    trace.map(({ data: data1, ...rest1 }) => {
      const { data: data2, ...rest2 } = data1;
      const { data: data3, ...rest3 } = data2;
      const { headers, ...rest4 } = data3;
      assertEqual(typeof headers, "object");
      return {
        ...rest1,
        data: {
          ...rest2,
          data: { ...rest3, data: { ...rest4, headers: null } },
        },
      };
    });

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

  const trace = [
    {
      type: "send",
      data: {
        type: "event",
        data: {
          type: "before",
          index: 1,
          data: {
            type: "response",
            protocol: "HTTP/1.1",
            method: "GET",
            headers: null,
            url: "/route/foo/bar/qux",
            route: "/route/*/:param1/:param2",
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
            type: "response",
            status: 200,
            message: "OK",
            headers: null,
          },
          group: 0,
          time: 0,
        },
      },
    },
  ];

  assertDeepEqual(
    cleanupHeaders(
      await testHookAsync(
        hookResponse,
        unhookResponse,
        { hooks: { http: true } },
        async () => {
          await scenarioAsync(Http.createServer());
        },
      ),
    ),
    trace,
  );

  assertDeepEqual(
    cleanupHeaders(
      await testHookAsync(
        hookResponse,
        unhookResponse,
        { hooks: { http: true } },
        async () => {
          await scenarioAsync(new Http.Server());
        },
      ),
    ),
    trace,
  );
};

testAsync();
