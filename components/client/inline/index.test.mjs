/* eslint-env node */
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import Client from "./index.mjs";

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { createConfiguration } = await buildOneAsync("configuration", "test");
  const { createClient, executeClientAsync, interruptClient, sendClient } =
    Client(dependencies);
  const client = createClient({});
  setTimeout(() => {
    sendClient(client, {
      type: "initialize",
      data: createConfiguration("/cwd"),
    });
    interruptClient(client);
  });
  await executeClientAsync(client);
};

testAsync();
