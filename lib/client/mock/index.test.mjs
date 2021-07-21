import { strict as Assert } from "assert";
import Client from "./index.mjs";

const { deepEqual } = Assert;

const mainAsync = async () => {
  const {
    initializeClient,
    terminateClient,
    asyncClientTermination,
    sendClient,
  } = Client({});

  const buffer = [];

  const client = initializeClient({ buffer });

  sendClient(client, "data");

  terminateClient(client);

  await asyncClientTermination(client);

  deepEqual(buffer, ["data"]);
};

mainAsync();
