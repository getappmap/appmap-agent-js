import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import Messaging from "./messaging.mjs";

const { deepEqual } = Assert;

const mainAsync = async () => {
  const { initializeMessaging, messageEvent } = Messaging(
    await buildAllAsync(["expect", "util", "client"], {
      expect: "error",
      client: "mock",
    }),
  );
  const buffer = [];
  const messaging = initializeMessaging("identifier", { buffer });
  buffer.pop();
  messageEvent(messaging, "data");
  deepEqual(buffer, [
    {
      type: "send",
      session: "identifier",
      message: {
        type: "event",
        data: "data",
      },
    },
  ]);
};

mainAsync();
