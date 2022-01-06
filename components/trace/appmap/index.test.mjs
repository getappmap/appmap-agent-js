import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Trace from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const { makeLocation, stringifyLocation } = await buildTestComponentAsync(
  "location",
);
const { compileTrace } = Trace(dependencies);
const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    recorder: "process",
    agent: {
      directory: "file:///agent",
      package: {
        name: "agent",
        version: "1.2.3",
        homepage: null,
      },
    },
    pruning: true,
    "function-name-placeholder": "$",
  },
  "file:///base",
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
        url: "file:///home/filename.js",
        content: "function f (x) {}",
        shallow: false,
        exclude: [
          {
            combinator: "or",
            "every-label": true,
            "some-label": true,
            "qualified-name": true,
            name: true,
            excluded: false,
            recursive: true,
          },
        ],
        inline: false,
      },
    ],
    [
      {
        type: "begin",
        index: indexes.event1,
        time: 0,
        data: {
          type: "apply",
          function: stringifyLocation(
            makeLocation("file:///home/filename.js", 1, 0),
          ),
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
        engine: null,
      },
      frameworks: [],
      client: {
        name: "agent",
        url: "https://github.com/applandinc/appmap-agent-js",
        version: "1.2.3",
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
