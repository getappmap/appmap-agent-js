import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import State from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
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
  const configuration = extendConfiguration(
    createConfiguration("/"),
    {
      packages: [
        {
          regexp: "^",
        },
      ],
    },
    "/",
  );
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
  assertEqual(getInstrumentationIdentifier(state).startsWith(identifier), true);
  assertDeepEqual(instrument(state, "script", "/filename.js", "123;"), {
    message: {
      type: "send",
      session: "uuid",
      data: {
        type: "module",
        data: {
          kind: "script",
          path: "/filename.js",
          code: null,
          children: [],
        },
      },
    },
    code: "123;",
  });
  assertDeepEqual(terminateState(state, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

testAsync();
