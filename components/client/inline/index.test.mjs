/* eslint-env node */
import { tmpdir } from "os";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Client from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { createClient, executeClientAsync, interruptClient, sendClient } =
  Client(dependencies);
const client = createClient({});
setTimeout(() => {
  sendClient(client, [
    "initialize",
    createConfiguration(
      `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
    ),
  ]);
  sendClient(client, ["start", "track", {}]);
  sendClient(client, ["terminate", { errors: [], status: 0 }]);
  interruptClient(client);
});
await executeClientAsync(client);
