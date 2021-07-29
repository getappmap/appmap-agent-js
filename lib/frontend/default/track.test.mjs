import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Track from "./track.mjs";

const { deepEqual: assertDeepEqual, throws: assertThrows } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration },
  } = dependencies;
  const { createSession, initializeSession } = Session(dependencies);
  const { createTrack, controlTrack } = Track(dependencies);
  const session = createSession("uuid", createConfiguration("/"));
  initializeSession(session);
  const track = createTrack("index", { foo: "bar" });
  assertDeepEqual(controlTrack(session, track, "start"), {
    type: "send",
    session: "uuid",
    data: {
      type: "track",
      data: {
        type: "start",
        track: "index",
        options: { foo: "bar" },
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
