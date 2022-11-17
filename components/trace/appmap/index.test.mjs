import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { makeLocation } from "../../location/index.mjs?env=test";
import { compileTrace } from "./index.mjs?env=test";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    name: "name",
    recorder: "process",
    agent: {
      directory: "protocol://host/agent/",
      package: {
        name: "agent",
        version: "1.2.3",
        homepage: null,
      },
    },
    pruning: true,
    "function-name-placeholder": "$",
  },
  "protocol://host/base/",
);

const tabs = {
  file: 1,
  track: 2,
  event1: 5,
  event2: 6,
};

const location = makeLocation("protocol://host/home/dirname/filename.js", {
  line: 1,
  column: 0,
});

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
      url: "protocol://host/home/dirname/filename.js",
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
        this: { type: "string", print: "THIS-PRINT-1" },
        arguments: [{ type: "string", print: "ARG-PRINT-1" }],
      },
    },
    {
      type: "event",
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
      group: 0,
      child: 1,
      description: "description",
    },
    {
      type: "event",
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
          name: "dirname",
          children: [
            {
              type: "class",
              name: "filename",
              children: [
                {
                  type: "function",
                  name: "f",
                  location: "dirname/filename.js:1",
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
          path: "dirname/filename.js",
          lineno: 1,
          static: false,
          receiver: {
            name: "this",
            class: "string",
            object_id: null,
            value: "this-print-1",
          },
          parameters: [
            {
              name: "x",
              class: "string",
              object_id: null,
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
          path: "dirname/filename.js",
          lineno: 1,
          static: false,
          receiver: {
            name: "this",
            class: "string",
            object_id: null,
            value: "this-print-2",
          },
          parameters: [
            {
              name: "x",
              class: "string",
              object_id: null,
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
            object_id: null,
            value: "result-print-2",
          },
          exceptions: null,
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
            object_id: null,
            value: "result-print-1",
          },
          exceptions: null,
        },
      ],
    },
  },
);
