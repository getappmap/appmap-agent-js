import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import State from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
    uuid: "stub",
    specifier: "default",
    repository: "stub",
    configuration: "default",
    serialization: "stub",
    instrumentation: "transparent",
    time: "stub",
  });
  const {
    configuration: { createConfiguration },
  } = dependencies;
  const {
    createState,
    initializeState,
    terminateState,
    createTrack,
    controlTrack,
    declareGroup,
    getInstrumentationIdentifier,
    instrument,
  } = State(dependencies);
  const configuration = createConfiguration("/");
  const { "hidden-identifier": identifier } = configuration;
  const state = createState(configuration);
  assertDeepEqual(initializeState(state), {
    type: "initialize",
    session: "uuid",
    configuration,
  });
  {
    const track = createTrack(state, "options");
    assertDeepEqual(track, {
      index: 1,
      state: { value: 0 },
      options: "options",
    });
    assertDeepEqual(controlTrack(state, track, "start"), {
      type: "send",
      session: "uuid",
      data: {
        type: "track",
        data: { type: "start", track: 1, options: "options" },
      },
    });
  }
  assertDeepEqual(declareGroup(state, "group"), {
    type: "send",
    session: "uuid",
    data: { type: "group", data: "group" },
  });
  assertEqual(getInstrumentationIdentifier(state), identifier);
  assertDeepEqual(instrument(state, "kind", "path", "code"), {
    message: {
      type: "send",
      session: "uuid",
      data: {
        type: "module",
        data: { kind: "kind", path: "path", code: "code", children: [] },
      },
    },
    code: "code",
  });
  assertDeepEqual(terminateState(state, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

testAsync();
