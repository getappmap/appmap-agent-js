/* eslint-env node */
import { buildTestAsync } from "../../build.mjs";
import Client from "./index.mjs";

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const { createClient, executeClientAsync, interruptClient, sendClient } =
    Client(dependencies);
  const {
    configuration: { createConfiguration },
  } = dependencies;
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
