import { assertDeepEqual, makeAbsolutePath } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Metadata from "./metadata.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const { compileMetadata } = Metadata(dependencies);

const test = (conf, cwd, termination = { errors: [], status: 0 }) => {
  let configuration = createConfiguration(cwd);
  configuration = extendConfiguration(configuration, conf, cwd);
  configuration = extendConfiguration(
    configuration,
    {
      recorder: "process",
      agent: {
        directory: makeAbsolutePath("agent"),
        package: {
          name: "appmap-agent-js",
          version: "1.2.3",
          homepage: "http://homepage",
        },
      },
    },
    null,
  );
  // console.log(configuration);
  return compileMetadata(configuration, termination);
};

const default_meta_data = {
  app: null,
  name: null,
  labels: [],
  language: { name: "ecmascript", version: "2020", engine: null },
  frameworks: [],
  client: {
    name: "appmap-agent-js",
    version: "1.2.3",
    url: "http://homepage",
  },
  recorder: { name: "process" },
  recording: null,
  git: null,
  test_status: "succeeded",
  exception: null,
};

assertDeepEqual(test({}, makeAbsolutePath("cwd")), default_meta_data);

// recorder //
assertDeepEqual(test({ recorder: "process" }, makeAbsolutePath("cwd")), {
  ...default_meta_data,
  recorder: { name: "process" },
});

// termination //

assertDeepEqual(
  test({}, makeAbsolutePath("cwd"), {
    errors: [
      {
        name: "error-name",
        message: "error-message",
      },
    ],
    status: 0,
  }),
  {
    ...default_meta_data,
    test_status: "failed",
    exception: { class: "error-name", message: "error-message" },
  },
);

// app //

assertDeepEqual(test({ name: "app-name" }, makeAbsolutePath("cwd")), {
  ...default_meta_data,
  app: "app-name",
});

// name //

assertDeepEqual(test({ "map-name": "map-name" }, makeAbsolutePath("cwd")), {
  ...default_meta_data,
  name: "map-name",
});

assertDeepEqual(
  test({ output: { basename: "basename" } }, makeAbsolutePath("cwd")),
  {
    ...default_meta_data,
    name: "basename",
  },
);

assertDeepEqual(
  test({ main: "/directory/filename.js" }, makeAbsolutePath("cwd")),
  {
    ...default_meta_data,
    name: "filename",
  },
);

// recording //

assertDeepEqual(
  test(
    {
      recording: {
        "defined-class": "defined-class",
        "method-id": "method-id",
      },
    },
    makeAbsolutePath("cwd"),
  ),
  {
    ...default_meta_data,
    recording: { defined_class: "defined-class", method_id: "method-id" },
  },
);

// engine //

assertDeepEqual(
  test(
    { engine: { name: "engine-name", version: "engine-version" } },
    makeAbsolutePath("cwd"),
  ),
  {
    ...default_meta_data,
    language: {
      ...default_meta_data.language,
      engine: "engine-name@engine-version",
    },
  },
);

assertDeepEqual(
  test(
    { engine: { name: "engine-name", version: "1.2.3" } },
    makeAbsolutePath("cwd"),
  ),
  {
    ...default_meta_data,
    language: {
      ...default_meta_data.language,
      engine: "engine-name@1.2.3",
    },
  },
);
