import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import Messaging from "./messaging.mjs";
import Track from "./track.mjs";

const { deepEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAllAsync(["expect", "util", "client"], {
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
  disableTrack(messaging, track);
  enableTrack(messaging, track);
  terminateTrack(messaging, track);
  deepEqual(buffer, [
    {
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
    },
    {
      type: "send",
      session: "identifier",
      message: {
        type: "track",
        data: {
          type: "disable",
          track: 123,
        },
      },
    },
    {
      type: "send",
      session: "identifier",
      message: {
        type: "track",
        data: {
          type: "enable",
          track: 123,
        },
      },
    },
    {
      type: "send",
      session: "identifier",
      message: {
        type: "track",
        data: {
          type: "terminate",
          track: 123,
        },
      },
    },
  ]);
};

mainAsync();
