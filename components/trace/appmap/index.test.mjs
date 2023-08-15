import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import { compileTrace } from "./index.mjs";

const { undefined } = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    appmap_dir: "appmap_dir",
    appmap_file: "appmap_file",
    "map-name": "map-name",
    name: "app-name",
    recorder: "process",
    packages: [
      {
        regexp: "^",
        enabled: true,
        "inline-source": false,
        exclude: [],
      },
    ],
    agent: {
      directory: "protocol://host/agent/",
      package: {
        name: "agent",
        version: "1.2.3",
        homepage: null,
      },
    },
    validate: {
      appmap: true,
    },
    pruning: true,
  },
  "protocol://host/base/",
);

const tabs = {
  file: 1,
  track: 2,
  event1: 5,
  event2: 6,
};

const location = stringifyLocation({
  hash: null,
  url: "protocol://host/home/dirname/filename.js",
  position: { line: 1, column: 0 },
});

const files = [
  {
    url: "protocol://host/home/dirname/filename.js",
    content: "function f (x) {}",
    hash: "hash",
  },
];

const events = [
  {
    type: "event",
    session: "session",
    site: "begin",
    tab: tabs.event1,
    group: 0,
    time: 0,
    payload: {
      type: "apply",
      function: location,
      this: { type: "string", print: "THIS-PRINT-1" },
      arguments: [{ type: "string", print: "ARG-PRINT-1" }],
    },
  },
  {
    type: "event",
    session: "session",
    site: "begin",
    tab: tabs.event2,
    group: 0,
    time: 0,
    payload: {
      type: "apply",
      function: location,
      this: { type: "string", print: "this-print-2" },
      arguments: [{ type: "string", print: "arg-print-2" }],
    },
  },
  {
    type: "group",
    session: "session",
    group: 0,
    child: 1,
    description: "description",
  },
  {
    type: "event",
    session: "session",
    site: "end",
    tab: tabs.event2,
    time: 0,
    group: 0,
    payload: {
      type: "return",
      function: location,
      result: {
        type: "string",
        print: "result-print-2",
      },
    },
  },
  {
    type: "event",
    session: "session",
    site: "end",
    tab: tabs.event1,
    time: 0,
    group: 0,
    payload: {
      type: "return",
      function: location,
      result: {
        type: "string",
        print: "result-print-1",
      },
    },
  },
  {
    type: "amend",
    session: "session",
    tab: tabs.event1,
    site: "begin",
    payload: {
      type: "apply",
      function: location,
      this: { type: "string", print: "this-print-1" },
      arguments: [{ type: "string", print: "arg-print-1" }],
    },
  },
  {
    type: "error",
    session: "session",
    error: {
      type: "number",
      print: "123",
    },
  },
];

const expected = {
  url: "protocol://host/base/appmap_dir/process/appmap_file.appmap.json",
  content: {
    version: "1.8.0",
    metadata: {
      name: "map-name",
      app: "app-name",
      labels: [],
      language: {
        name: "javascript",
        version: "ES.Next",
        engine: undefined,
      },
      frameworks: [],
      client: {
        name: "agent",
        url: "https://github.com/applandinc/appmap-agent-js",
        version: "1.2.3",
      },
      recorder: { name: "process", type: "process" },
      recording: undefined,
      git: undefined,
      test_status: undefined,
      exception: {
        class: "number",
        message: "123",
      },
    },
    classMap: [
      {
        type: "package",
        name: "dirname",
        children: [
          {
            type: "class",
            name: "filename",
            children: [
              {
                type: "function",
                name: "f",
                location: "./dirname/filename.js:1",
                static: false,
                labels: [],
                comment: null,
                source: null,
              },
            ],
          },
        ],
      },
    ],
    events: [
      {
        id: 1,
        event: "call",
        thread_id: 0,
        defined_class: "filename",
        method_id: "f",
        path: "./dirname/filename.js",
        lineno: 1,
        static: false,
        receiver: {
          name: "this",
          class: "string",
          object_id: undefined,
          value: "this-print-1",
        },
        parameters: [
          {
            name: "x",
            class: "string",
            object_id: undefined,
            value: "arg-print-1",
          },
        ],
      },
      {
        id: 2,
        event: "call",
        thread_id: 0,
        defined_class: "filename",
        method_id: "f",
        path: "./dirname/filename.js",
        lineno: 1,
        static: false,
        receiver: {
          name: "this",
          class: "string",
          object_id: undefined,
          value: "this-print-2",
        },
        parameters: [
          {
            name: "x",
            class: "string",
            object_id: undefined,
            value: "arg-print-2",
          },
        ],
      },
      {
        id: 3,
        event: "return",
        thread_id: 0,
        parent_id: 2,
        elapsed: 0,
        return_value: {
          name: "return",
          class: "string",
          object_id: undefined,
          value: "result-print-2",
        },
        exceptions: undefined,
      },
      {
        id: 4,
        event: "return",
        thread_id: 0,
        parent_id: 1,
        elapsed: 0,
        return_value: {
          name: "return",
          class: "string",
          object_id: undefined,
          value: "result-print-1",
        },
        exceptions: undefined,
      },
    ],
  },
};

assertDeepEqual(
  compileTrace(configuration, files, events, { type: "manual" }),
  expected,
);

const testFailure = (raw, resolved) => {
  expected.content.metadata.test_failure = resolved;
  assertDeepEqual(
    compileTrace(configuration, files, events, {
      type: "manual",
      failure: raw,
    }),
    expected,
  );
};

testFailure(
  {
    message: "test failure message",
    location: "protocol://host/home/dirname/filename.js:42:1",
  },
  { message: "test failure message", location: "dirname/filename.js:42" },
);

testFailure(
  { message: "test failure message" },
  { message: "test failure message" },
);

testFailure(
  {
    message: "test failure message",
    location: "/foo/bar/dirname/filename.js:42:7",
  },
  {
    message: "test failure message",
    location: "../foo/bar/dirname/filename.js:42",
  },
);
