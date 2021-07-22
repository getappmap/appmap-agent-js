import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Track from "./track.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAsync({
    util: "default",
    expect: "error",
  });
  const { createSession, initializeSession } = Session(dependencies);
  const { createTrack, startTrack, stopTrack, playTrack, pauseTrack } =
    Track(dependencies);
  const session = createSession("uuid", "options");
  initializeSession(session);
  const track = createTrack("index", "options");
  assertDeepEqual(startTrack({ session }, track), {
    type: "send",
    session: "uuid",
    data: {
      type: "track",
      data: {
        type: "start",
        track: "index",
        options: "options",
      },
    },
  });
  assertDeepEqual(pauseTrack({ session }, track), {
    type: "send",
    session: "uuid",
    data: {
      type: "track",
      data: {
        type: "pause",
        track: "index",
      },
    },
  });
  assertDeepEqual(playTrack({ session }, track), {
    type: "send",
    session: "uuid",
    data: {
      type: "track",
      data: {
        type: "play",
        track: "index",
      },
    },
  });
  assertDeepEqual(stopTrack({ session }, track), {
    type: "send",
    session: "uuid",
    data: {
      type: "track",
      data: {
        type: "stop",
        track: "index",
      },
    },
  });
};

mainAsync();
