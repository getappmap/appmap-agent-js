import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Messaging from "./messaging.mjs";

const { deepEqual } = Assert;

const mainAsync = async () => {
  const { initializeMessaging, messageEvent } = Messaging(
    await buildAsync({
      util: "default",
      expect: "error",
      client: "mock",
    }),
  );
  const buffer = [];
  const messaging = initializeMessaging("identifier", { buffer });
  buffer.pop();
  messageEvent(messaging, "data");
  deepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "event",
      data: "data",
    },
  });
};

mainAsync();
