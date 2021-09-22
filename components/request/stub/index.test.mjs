import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Request from "./index.mjs";

const {
  // deepEqual: assertDeepEqual,
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

{
  const server = openServer();
  await listenAsync(server, 0);
  getServerPort(server);
  await requestAsync("host", "port", "method", "path", "body");
  closeServer(server);
  await promiseServerTermination(server);
}
