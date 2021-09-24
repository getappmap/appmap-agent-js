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
    trackClientAsync,
  } = Client(await buildTestDependenciesAsync(import.meta.url));
  const client = openClient({});
  setTimeout(async () => {
    traceClient(client, "data");
    await trackClientAsync(client, "GET", "/path", null);
    closeClient(client);
  });
  assertDeepEqual(await promiseClientTermination(client), [
    "data",
    { method: "GET", path: "/path", body: null },
  ]);
};

testAsync();
