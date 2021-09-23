/* eslint-env node */
import { tmpdir } from "os";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Client from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { openClient, promiseClientTermination, closeClient, traceClient } =
  Client(dependencies);
const client = openClient({});
setTimeout(() => {
  traceClient(client, [
    "initialize",
    createConfiguration(
      `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
    ),
  ]);
  traceClient(client, ["start", "track", { path: null, data: {} }]);
  traceClient(client, ["terminate", { errors: [], status: 0 }]);
  closeClient(client);
});
await promiseClientTermination(client);
