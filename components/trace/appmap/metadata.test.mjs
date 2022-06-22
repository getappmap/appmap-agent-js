import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Metadata from "./metadata.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const { compileMetadata } = Metadata(dependencies);

const test = (conf, url, termination = { errors: [], status: 0 }) => {
  let configuration = createConfiguration(url);
  configuration = extendConfiguration(configuration, conf, url);
  configuration = extendConfiguration(
    configuration,
    {
      recorder: "process",
      agent: {
        directory: "file:///agent",
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
  language: { name: "javascript", version: "ES.Next", engine: null },
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

assertDeepEqual(test({}, "file:///cwd"), default_meta_data);

// recorder //
assertDeepEqual(test({ recorder: "process" }, "file:///cwd"), {
  ...default_meta_data,
  recorder: { name: "process" },
});

// termination //

assertDeepEqual(
  test({}, "file:///cwd", {
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

assertDeepEqual(test({ name: "app-name" }, "file:///cwd"), {
  ...default_meta_data,
  app: "app-name",
});

// name //

assertDeepEqual(test({ "map-name": "map-name" }, "file:///cwd"), {
  ...default_meta_data,
  name: "map-name",
});

assertDeepEqual(test({ appmap_file: "basename" }, "file:///cwd"), {
  ...default_meta_data,
  name: "basename",
});

assertDeepEqual(test({ main: "/directory/filename.js" }, "file:///cwd"), {
  ...default_meta_data,
  name: "filename",
});

// recording //

assertDeepEqual(
  test(
    {
      recording: {
        "defined-class": "defined-class",
        "method-id": "method-id",
      },
    },
    "file:///cwd",
  ),
  {
    ...default_meta_data,
    recording: { defined_class: "defined-class", method_id: "method-id" },
  },
);
