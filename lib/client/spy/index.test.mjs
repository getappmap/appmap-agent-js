import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Client from "./index.mjs";

const { deepEqual } = Assert;

const testAsync = async () => {
  const {
    initializeClient,
    terminateClient,
    asyncClientTermination,
    sendClient,
  } = Client(
    await buildAsync({
      violation: "error",
      assert: "debug",
      util: "default",
    }),
  );

  const buffer = [];

  const client = initializeClient({ "client-spy-buffer": buffer });

  sendClient(client, "data");

  terminateClient(client);

  await asyncClientTermination(client);

  deepEqual(buffer, ["data"]);
};

testAsync();
