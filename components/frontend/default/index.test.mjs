import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import Frontend from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { createConfiguration, extendConfiguration } = await buildOneAsync(
    "configuration",
    "test",
  );
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
  const frontend = createFrontend(configuration);
  assertDeepEqual(initializeFrontend(frontend), {
    type: "initialize",
    data: configuration,
  });
  {
    const track = createTrack(frontend, "options");
    assertDeepEqual(controlTrack(frontend, track, "start"), {
      type: "send",
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
  assertDeepEqual(terminateFrontend(frontend, { errors: [], status: 123 }), {
    type: "terminate",
    data: { errors: [], status: 123 },
  });
};

testAsync();
