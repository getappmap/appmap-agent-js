import { strict as Assert } from "assert";
import Client from "./index.mjs";

const { deepEqual } = Assert;

const mainAsync = async () => {
  const {
    initializeClient,
    terminateClient,
    asyncClientTermination,
    sendClient,
  } = Client(await buildAsync({util:"default"}));

  const buffer = [];

  const client = initializeClient({ "client-mock-buffer": buffer });

  sendClient(client, "data");

  terminateClient(client);

  await asyncClientTermination(client);

  deepEqual(buffer, ["data"]);
};

mainAsync();
