import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { compileMetadata } from "./metadata.mjs";

const { undefined } = globalThis;

const test = (conf, url, errors = [], termination = { type: "manual" }) => {
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
  return compileMetadata(configuration, errors, termination);
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
  test_status: undefined,
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

// exception //

assertDeepEqual(
  test({}, "protocol://host/base/", [
    {
      type: "number",
      print: "123",
    },
  ]),
  {
    ...default_meta_data,
    exception: { class: "number", message: "123" },
  },
);

assertDeepEqual(
  test({}, "protocol://host/base/", [
    {
      type: "object",
      print: "print",
      index: 123,
      constructor: "constructor",
      specific: null,
    },
  ]),
  {
    ...default_meta_data,
    exception: { class: "constructor", message: "print" },
  },
);

assertDeepEqual(
  test({}, "protocol://host/base/", [
    {
      type: "object",
      print: "print",
      index: 123,
      constructor: "constructor",
      specific: {
        type: "error",
        name: "name",
        message: "message",
        stack: "stack",
      },
    },
  ]),
  {
    ...default_meta_data,
    exception: { class: "name", message: "message" },
  },
);

// status //

assertDeepEqual(
  test({}, "protocol://host/base/", [], { type: "test", passed: true }),
  {
    ...default_meta_data,
    test_status: "succeeded",
  },
);

assertDeepEqual(
  test({}, "protocol://host/base/", [], { type: "test", passed: false }),
  {
    ...default_meta_data,
    test_status: "failed",
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
