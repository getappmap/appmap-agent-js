import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Trace from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const { compileTrace } = Trace(dependencies);
const configuration = extendConfiguration(
  createConfiguration("/cwd"),
  {
    pruning: true,
    "function-name-placeholder": "$",
  },
  "/cwd",
);
const indexes = {
  file: 1,
  track: 2,
  event1: 5,
  event2: 6,
};
assertDeepEqual(
  compileTrace(
    configuration,
    [
      {
        index: indexes.file,
        path: "/cwd/filename.js",
        type: "script",
        code: "function f (x) {}",
        exclude: [],
      },
    ],
    [
      {
        type: "begin",
        index: indexes.event1,
        time: 0,
        data: {
          type: "apply",
          function: `${String(indexes.file)}/body/0`,
          this: { type: "string", print: "this-print" },
          arguments: [{ type: "string", print: "arg-print" }],
        },
      },
      {
        type: "end",
        index: indexes.event1,
        time: 0,
        data: {
          type: "apply",
          error: null,
          result: {
            type: "string",
            print: "result-print",
          },
        },
      },
    ],
    { errors: [], status: 0 },
  ),
  {
    version: "1.6.0",
    metadata: {
      name: null,
      app: null,
      labels: [],
      language: {
        name: "ecmascript",
        version: "2020",
        engine: "engine@0.0.0",
      },
      frameworks: [],
      client: {
        name: "@appland/appmap-agent-js",
        url: "https://github.com/applandinc/appmap-agent-js",
        version: "0.0.0",
      },
      recorder: { name: "process" },
      recording: null,
      git: null,
      test_status: "succeeded",
      exception: null,
    },
    classMap: [
      {
        type: "package",
        name: "filename.js",
        children: [
          {
            type: "class",
            name: "f",
            children: [
              {
                type: "function",
                name: "$",
                location: "filename.js:1",
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
        defined_class: "f",
        method_id: "$",
        path: "filename.js",
        lineno: 1,
        static: false,
        receiver: {
          name: "this",
          class: "string",
          object_id: null,
          value: "this-print",
        },
        parameters: [
          {
            name: "x",
            class: "string",
            object_id: null,
            value: "arg-print",
          },
        ],
      },
      {
        id: 2,
        event: "return",
        thread_id: 0,
        parent_id: 1,
        elapsed: 0,
        return_value: {
          name: "return",
          class: "string",
          object_id: null,
          value: "result-print",
        },
        exceptions: null,
      },
    ],
  },
);
