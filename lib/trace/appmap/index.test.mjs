import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import Trace from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { compileTrace } = Trace(dependencies);
  const configuration = extendConfiguration(
    createConfiguration("/cwd"),
    {
      pruning: true,
      "function-name-placeholder": "$",
    },
    "/cwd",
  );
  const default_serial = {
    type: null,
    constructor: null,
    index: null,
    truncated: false,
    print: null,
    specific: null,
  };
  const indexes = {
    file: 1,
    track: 2,
    group1: 3,
    group2: 4,
    event1: 5,
    event2: 6,
  };
  assertDeepEqual(
    compileTrace(
      configuration,
      [
        {
          type: "file",
          data: {
            index: indexes.file,
            path: "/cwd/filename.js",
            type: "script",
            code: "function f (x) {}",
          },
        },
        {
          type: "track",
          data: {
            type: "start",
            index: indexes.track,
            options: {
              recording: {
                "method-id": "method-id",
                "defined-class": "defined-class",
              },
            },
          },
        },
        {
          type: "event",
          data: {
            type: "before",
            index: indexes.event1,
            group: indexes.group1,
            time: 0,
            data: {
              type: "apply",
              function: `${String(indexes.file)}/body/0`,
              this: { ...default_serial, type: "string", print: "this-print" },
              arguments: [
                { ...default_serial, type: "string", print: "arg-print" },
              ],
            },
          },
        },
        {
          type: "group",
          data: { group: indexes.group2, origin: indexes.group1 },
        },
        {
          type: "event",
          data: {
            type: "after",
            index: indexes.event1,
            group: indexes.group1,
            time: 0,
            data: {
              type: "apply",
              error: null,
              result: {
                ...default_serial,
                type: "string",
                print: "result-print",
              },
            },
          },
        },
        {
          type: "track",
          data: { type: "pause", index: indexes.track },
        },
        {
          type: "event",
          data: {
            type: "before",
            index: indexes.event2,
            group: indexes.group2,
            time: 0,
            data: {
              type: "query",
              database: "database",
              version: "version",
              sql: "sql",
              parameters: [],
            },
          },
        },
        {
          type: "track",
          data: { type: "play", index: indexes.track },
        },
        {
          type: "event",
          data: {
            type: "after",
            index: indexes.event2,
            group: indexes.group2,
            time: 0,
            data: {
              type: "query",
            },
          },
        },
      ],
      { errors: [], status: 0 },
    ),
    [
      {
        name: null,
        data: {
          version: "1.6.0",
          metadata: {
            name: null,
            app: null,
            labels: [],
            language: {
              name: "ecmascript",
              version: 2020,
              engine: null,
            },
            frameworks: [],
            client: {
              name: "@appland/appmap-agent-js",
              url: null,
              version: "0.0.0",
            },
            recorder: "process",
            recording: {
              defined_class: "defined-class",
              method_id: "method-id",
            },
            git: {
              repository: null,
              branch: null,
              commit: null,
              status: null,
              tag: null,
              annotated_tag: null,
              commits_since_tag: null,
              commits_since_annotated_tag: null,
            },
            test_status: "succeeded",
            exception: null,
          },
          classMap: [
            {
              type: "class",
              name: "filename.js",
              children: [
                {
                  type: "class",
                  name: "$",
                  bound: false,
                  children: [
                    {
                      type: "function",
                      name: "f",
                      location: "filename.js:1",
                      static: false,
                      labels: [],
                      comment: null,
                      source: null,
                      route: `${String(indexes.file)}/body/0`,
                    },
                  ],
                },
              ],
            },
          ],
          events: [
            {
              id: 2 * indexes.event1,
              event: "call",
              thread_id: 0,
              defined_class: "$",
              method_id: "f",
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
              id: 2 * indexes.event2,
              event: "call",
              thread_id: 0,
              sql_query: {
                database_type: "MANUFACTURED_APPMAP_DATABASE",
                server_version: null,
                sql: "SELECT * FROM MANUFACTURED_APPMAP_TABLE;",
                explain_sql: null,
              },
              message: [],
            },
            {
              id: 2 * indexes.event2 + 1,
              event: "return",
              thread_id: 0,
              parent_id: 2 * indexes.event2,
              elapsed: 0,
            },
            {
              id: 2 * indexes.event1 + 1,
              event: "return",
              thread_id: 0,
              parent_id: 2 * indexes.event1,
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
    ],
  );
};

testAsync();
