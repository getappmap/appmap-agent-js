import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Frontend from "./index.mjs";

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
    createFrontend,
    initializeFrontend,
    terminateFrontend,
    createTrack,
    controlTrack,
    declareGroup,
    getInstrumentationIdentifier,
    instrument,
  } = Frontend(dependencies);
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
  const frontend = createFrontend();
  assertDeepEqual(initializeFrontend(frontend, configuration), {
    type: "initialize",
    session: "uuid",
    configuration,
  });
  {
    const track = createTrack(frontend, "options");
    assertDeepEqual(controlTrack(frontend, track, "start"), {
      type: "send",
      session: "uuid",
      data: {
        type: "track",
        data: { type: "start", index: 1, options: "options" },
      },
    });
  }
  assertDeepEqual(
    declareGroup(frontend, {
      group: 123,
      origin: 456,
      description: "description",
    }),
    {
      type: "send",
      session: "uuid",
      data: {
        type: "group",
        data: { group: 123, origin: 456, description: "description" },
      },
    },
  );
  assertEqual(
    getInstrumentationIdentifier(frontend).startsWith(identifier),
    true,
  );
  assertDeepEqual(instrument(frontend, "script", "/filename.js", "123;"), {
    message: {
      type: "send",
      session: "uuid",
      data: {
        type: "file",
        data: {
          index: 0,
          exclude: [],
          type: "script",
          path: "/filename.js",
          code: "123;",
        },
      },
    },
    code: "123;",
  });
  assertDeepEqual(terminateFrontend(frontend, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

testAsync();