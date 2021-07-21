import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Messaging from "./messaging.mjs";
import Track from "./track.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAsync({
    util: "default",
    expect: "error",
    client: "mock",
  });
  const { initializeMessaging } = Messaging(dependencies);
  const { initializeTrack, terminateTrack, enableTrack, disableTrack } =
    Track(dependencies);
  const buffer = [];
  const messaging = initializeMessaging("identifier", { buffer });
  buffer.pop();
  const track = initializeTrack(messaging, 123, "options");
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "track",
      data: {
        type: "initialize",
        track: 123,
        options: "options",
      },
    },
  });
  disableTrack(messaging, track);
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "track",
      data: {
        type: "disable",
        track: 123,
      },
    },
  });
  enableTrack(messaging, track);
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "track",
      data: {
        type: "enable",
        track: 123,
      },
    },
  });
  terminateTrack(messaging, track);
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: {
      type: "track",
      data: {
        type: "terminate",
        track: 123,
      },
    },
  });
};

mainAsync();
