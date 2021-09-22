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
  openServer,
  listenAsync,
  promiseServerTermination,
  closeServer,
  getServerPort,
  requestAsync,
} = Request(dependencies);

// General //
{
  const server = openServer((method, path, body) => ({
    code: 200,
    message: "ok",
    body: { method, path, body },
  }));
  await listenAsync(server, 0);
  assertDeepEqual(
    await requestAsync(
      "localhost",
      getServerPort(server),
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
  closeServer(server);
  await promiseServerTermination(server);
}

// Unix Domain Socket + Null Body //
{
  const server = openServer((method, path, body) => ({
    code: 200,
    message: "ok",
    body: null,
  }));
  await listenAsync(
    server,
    `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
  );
  assertDeepEqual(
    await requestAsync(
      "localhost",
      getServerPort(server),
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
  closeServer(server);
  await promiseServerTermination(server);
}
