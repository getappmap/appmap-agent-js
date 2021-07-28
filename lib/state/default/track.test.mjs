import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Track from "./track.mjs";

const { deepEqual: assertDeepEqual, throws: assertThrows } = Assert;

const testAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
  });
  const { createSession, initializeSession } = Session(dependencies);
  const { createTrack, controlTrack } = Track(dependencies);
  const session = createSession("uuid", "options");
  initializeSession(session);
  const track = createTrack("index", "options");
  assertDeepEqual(controlTrack(session, track, "start"), {
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
  assertDeepEqual(controlTrack(session, track, "pause"), {
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
  assertDeepEqual(controlTrack(session, track, "play"), {
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
  assertDeepEqual(controlTrack(session, track, "stop"), {
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
  assertThrows(() => controlTrack(session, track, "foo"));
};

testAsync();
