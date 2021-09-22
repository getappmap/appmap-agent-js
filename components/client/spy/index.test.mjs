/* eslint-env node */

import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Client from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { openClient, promiseClientTermination, closeClient, sendClient } =
    Client(await buildTestDependenciesAsync(import.meta.url));
  const client = openClient({});
  setTimeout(() => {
    sendClient(client, "data");
    closeClient(client);
  });
  assertDeepEqual(await promiseClientTermination(client), ["data"]);
};

testAsync();
