import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Request from "./index.mjs";

const {
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
