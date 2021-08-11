import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Session from "./session.mjs";
import Track from "./track.mjs";

const { deepEqual: assertDeepEqual, throws: assertThrows } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createConfiguration } = await buildTestComponentAsync(
    "configuration",
  );
  const { createSession, initializeSession } = Session(dependencies);
  const { createTrack, controlTrack } = Track(dependencies);
  const session = createSession(createConfiguration("/"));
  initializeSession(session);
  const track = createTrack("index", { foo: "bar" });
  assertDeepEqual(controlTrack(session, track, "start"), {
    type: "trace",
    data: {
      type: "track",
      data: {
        type: "start",
        index: "index",
        options: { foo: "bar" },
      },
    },
  });
  assertDeepEqual(controlTrack(session, track, "pause"), {
    type: "trace",
    data: {
      type: "track",
      data: {
        type: "pause",
        index: "index",
      },
    },
  });
  assertDeepEqual(controlTrack(session, track, "play"), {
    type: "trace",
    data: {
      type: "track",
      data: {
        type: "play",
        index: "index",
      },
    },
  });
  assertDeepEqual(controlTrack(session, track, "stop"), {
    type: "trace",
    data: {
      type: "track",
      data: {
        type: "stop",
        index: "index",
      },
    },
  });
  assertThrows(() => controlTrack(session, track, "foo"));
};

testAsync();
