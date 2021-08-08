/* eslint-env node */

import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Client from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { createClient, executeClientAsync, interruptClient, sendClient } =
    Client(await buildDependenciesAsync(import.meta.url, "test"));
  const client = createClient({});
  setTimeout(() => {
    sendClient(client, "data");
    interruptClient(client);
  });
  assertDeepEqual(await executeClientAsync(client), ["data"]);
};

testAsync();
