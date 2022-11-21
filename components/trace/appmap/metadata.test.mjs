const { undefined } = globalThis;

import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { compileMetadata } from "./metadata.mjs?env=test";

const test = (conf, url, errors = [], status = 0) => {
  let configuration = createConfiguration(url);
  configuration = extendConfiguration(configuration, conf, url);
  configuration = extendConfiguration(
    configuration,
    {
      recorder: "process",
      agent: {
        directory: "agent",
        package: {
          name: "appmap-agent-js",
          version: "1.2.3",
          homepage: "http://host/homepage",
        },
      },
    },
    "protocol://host/base/",
  );
  return compileMetadata(configuration, errors, status);
};

const default_meta_data = {
  app: undefined,
  name: undefined,
  labels: [],
  language: { name: "javascript", version: "ES.Next", engine: undefined },
  frameworks: [],
  client: {
    name: "appmap-agent-js",
    version: "1.2.3",
    url: "http://host/homepage",
  },
  recorder: { name: "process" },
  recording: undefined,
  git: undefined,
  test_status: "succeeded",
  exception: undefined,
};

assertDeepEqual(test({}, "protocol://host/base/"), default_meta_data);

// history //
assertEqual(
  typeof test(
    {
      recorder: "process",
      repository: {
        directory: import.meta.url,
        history: { repository: null, branch: null, commit: null },
        package: null,
      },
    },
    "protocol://host/base/",
  ).git.repository,
  "string",
);

// recorder //
assertDeepEqual(test({ recorder: "process" }, "protocol://host/base/"), {
  ...default_meta_data,
  recorder: { name: "process" },
});

// termination //

assertDeepEqual(
  test(
    {},
    "protocol://host/base/",
    [
      {
        name: "error-name",
        message: "error-message",
      },
    ],
    0,
  ),
  {
    ...default_meta_data,
    test_status: "failed",
    exception: { class: "error-name", message: "error-message" },
  },
);

// app //

assertDeepEqual(test({ name: "app-name" }, "protocol://host/base/"), {
  ...default_meta_data,
  app: "app-name",
});

// name //

assertDeepEqual(test({ "map-name": "map-name" }, "protocol://host/base/"), {
  ...default_meta_data,
  name: "map-name",
});

assertDeepEqual(test({ appmap_file: "basename" }, "protocol://host/base/"), {
  ...default_meta_data,
  name: "basename",
});

assertDeepEqual(
  test({ main: "/directory/filename.js" }, "protocol://host/base/"),
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
    "protocol://host/base/",
  ),
  {
    ...default_meta_data,
    recording: { defined_class: "defined-class", method_id: "method-id" },
  },
);
