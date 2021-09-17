import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Backend from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // throws: assertThrows
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);
const { openBackend, sendBackend } = Backend(dependencies);

const configuration = createConfiguration("/cwd");

{
  const backend = openBackend();
  sendBackend(backend, ["initialize", configuration]);
  sendBackend(backend, [
    "file",
    {
      index: 1,
      shallow: false,
      source: false,
      exclude: [],
      type: "script",
      path: "/cwd/main.js",
      code: "function main () {}",
    },
  ]);
  sendBackend(backend, [
    "start",
    { track: "track", initialization: { output: { filename: "filename" } } },
  ]);
  sendBackend(backend, [
    "event",
    {
      type: "begin",
      index: 1,
      time: 0,
      data: {
        type: "apply",
        function: "1/body/0",
        this: {
          type: "string",
          print: "THIS",
        },
        arguments: [],
      },
    },
  ]);
  sendBackend(backend, [
    "event",
    {
      type: "end",
      index: 1,
      time: 0,
      data: {
        type: "apply",
        error: null,
        result: {
          type: "string",
          print: "RESULT",
        },
      },
    },
  ]);
  assertDeepEqual(
    sendBackend(backend, [
      "terminate",
      {
        errors: [
          {
            name: "error-name",
            message: "error-message",
            stack: "error-stack",
          },
        ],
        status: 1,
      },
    ]).map(({ data }) => data),
    [
      {
        version: "1.6.0",
        metadata: {
          name: "filename",
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
            version: "0.0.0",
            url: "https://github.com/applandinc/appmap-agent-js",
          },
          recorder: { name: "process" },
          recording: null,
          git: null,
          test_status: "failed",
          exception: { class: "error-name", message: "error-message" },
        },
        classMap: [
          {
            type: "package",
            name: "main.js",
            children: [
              {
                type: "class",
                name: "main",
                children: [
                  {
                    type: "function",
                    name: "()",
                    location: "main.js:1",
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
            event: "call",
            thread_id: 0,
            id: 1,
            defined_class: "main",
            method_id: "()",
            path: "main.js",
            lineno: 1,
            static: false,
            receiver: {
              name: "this",
              class: "string",
              object_id: null,
              value: "THIS",
            },
            parameters: [],
          },
          {
            event: "return",
            thread_id: 0,
            id: 2,
            parent_id: 1,
            elapsed: 0,
            return_value: {
              name: "return",
              class: "string",
              object_id: null,
              value: "RESULT",
            },
            exceptions: null,
          },
        ],
      },
    ],
  );
}
