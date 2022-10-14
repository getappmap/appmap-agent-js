import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  makeLocation,
  stringifyLocation,
} from "../../location/index.mjs?env=test";
import { compileTrace } from "./index.mjs?env=test";

const configuration = extendConfiguration(
  createConfiguration("file:///w:/home/"),
  {
    name: "name",
    recorder: "process",
    agent: {
      directory: "file:///w:/agent/",
      package: {
        name: "agent",
        version: "1.2.3",
        homepage: null,
      },
    },
    pruning: true,
    "function-name-placeholder": "$",
  },
  "file:///w:/base/",
);

const tabs = {
  file: 1,
  track: 2,
  event1: 5,
  event2: 6,
};

const location = stringifyLocation(
  makeLocation("file:///w:/home/filename.js", 1, 0),
);

assertDeepEqual(
  compileTrace(configuration, [
    {
      type: "start",
      configuration: {
        name: "NAME",
      },
      url: null,
    },
    {
      type: "source",
      url: "file:///w:/home/filename.js",
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
    {
      type: "event",
      site: "begin",
      tab: tabs.event1,
      group: 0,
      time: 0,
      payload: {
        type: "apply",
        function: location,
        this: { type: "string", print: "THIS-PRINT" },
        arguments: [{ type: "string", print: "ARG-PRINT" }],
      },
    },
    {
      type: "group",
      group: 0,
      child: 1,
      description: "description",
    },
    {
      type: "event",
      site: "end",
      tab: tabs.event1,
      time: 0,
      group: 0,
      payload: {
        type: "return",
        function: location,
        result: {
          type: "string",
          print: "result-print",
        },
      },
    },
    {
      type: "amend",
      tab: tabs.event1,
      site: "begin",
      payload: {
        type: "apply",
        function: location,
        this: { type: "string", print: "this-print" },
        arguments: [{ type: "string", print: "arg-print" }],
      },
    },
    {
      type: "error",
      name: "name",
      message: "message",
      stack: "stack",
    },
    {
      type: "stop",
      track: "track",
      status: 0,
    },
  ]),
  {
    head: { ...configuration, name: "NAME" },
    body: {
      version: "1.8.0",
      metadata: {
        name: null,
        app: "NAME",
        labels: [],
        language: {
          name: "javascript",
          version: "ES.Next",
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
        test_status: "failed",
        exception: {
          class: "name",
          message: "message",
        },
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
  },
);
