import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import Messaging from "./messaging.mjs";
import Recording from "./recording.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAllAsync(
    ["expect", "util", "client", "time"],
    {
      expect: "error",
      client: "mock",
      time: "mock",
    },
  );
  const { initializeMessaging } = Messaging(dependencies);
  const { recordBefore } = Recording(dependencies);
  const buffer = [];
  const messaging = initializeMessaging("identifier", { buffer });
  buffer.pop();
  recordBefore(messaging, "index", "group", "data");
  assertDeepEqual(buffer, [
    {
      type: "send",
      session: "identifier",
      message: {
        type: "event",
        data: {
          type: "before",
          time: "now",
          index: "index",
          group: "group",
          data: "data",
        },
      },
    },
  ]);
};

mainAsync();
