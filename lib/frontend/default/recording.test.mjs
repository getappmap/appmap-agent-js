import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Messaging from "./messaging.mjs";
import Recording from "./recording.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAsync({
    util: "default",
    expect: "error",
    client: "mock",
    time: "mock",
    grouping: "none",
  });
  const { initializeMessaging } = Messaging(dependencies);
  const { initializeRecording, terminateRecording, recordBefore, recordAfter } =
    Recording(dependencies);
  const buffer = [];
  const messaging = initializeMessaging("identifier", { buffer });
  const recording = initializeRecording({});
  buffer.pop();
  const index = recordBefore(messaging, recording, "data");
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "event",
      data: {
        type: "before",
        time: "now",
        index: 1,
        group: 0,
        data: "data",
      },
    },
  });
  recordAfter(messaging, recording, index, "data");
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "event",
      data: {
        type: "after",
        time: "now",
        index: 1,
        group: 0,
        data: "data",
      },
    },
  });
  terminateRecording(recording);
};

mainAsync();
