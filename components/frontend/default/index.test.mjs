import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Frontend from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createConfiguration, extendConfiguration } =
    await buildTestComponentAsync("configuration", "test");
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
    const track = createTrack(frontend, "configuration");
    assertDeepEqual(controlTrack(frontend, track, "start"), {
      type: "trace",
      data: {
        type: "track",
        data: { type: "start", index: 1, configuration: "configuration" },
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
      type: "trace",
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
      type: "trace",
      data: {
        type: "file",
        data: {
          index: 0,
          exclude: [],
          shallow: false,
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
