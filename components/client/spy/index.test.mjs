/* eslint-env node */

import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Client from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const {
    openClient,
    promiseClientTermination,
    closeClient,
    traceClient,
    trackClient,
    trackClientAsync,
  } = Client(await buildTestDependenciesAsync(import.meta.url));
  const client = openClient({});
  setTimeout(async () => {
    traceClient(client, "data");
    trackClient(client, "GET", "/sync", null);
    await trackClientAsync(client, "GET", "/async", null);
    closeClient(client);
  });
  assertDeepEqual(await promiseClientTermination(client), [
    "data",
    { method: "GET", path: "/sync", body: null },
    { method: "GET", path: "/async", body: null },
  ]);
};

testAsync();
