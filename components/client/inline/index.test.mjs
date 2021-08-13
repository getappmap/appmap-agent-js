/* eslint-env node */
import { tmpdir } from "os";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Client from "./index.mjs";

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createConfiguration } = await buildTestComponentAsync(
    "configuration",
  );
  const { createClient, executeClientAsync, interruptClient, sendClient } =
    Client(dependencies);
  const client = createClient({});
  setTimeout(() => {
    sendClient(client, {
      type: "initialize",
      data: createConfiguration(
        `${tmpdir()}/${Math.random().toString(36).substring(2)}`,
      ),
    });
    interruptClient(client);
  });
  await executeClientAsync(client);
};

testAsync();
