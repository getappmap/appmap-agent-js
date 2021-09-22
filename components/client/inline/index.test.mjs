/* eslint-env node */
import { tmpdir } from "os";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Client from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { openClient, promiseClientTermination, closeClient, sendClient } =
  Client(dependencies);
const client = openClient({});
setTimeout(() => {
  sendClient(client, [
    "initialize",
    createConfiguration(
      `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
    ),
  ]);
  sendClient(client, ["start", "track", { path: null, data: {} }]);
  sendClient(client, ["terminate", { errors: [], status: 0 }]);
  closeClient(client);
});
await promiseClientTermination(client);
