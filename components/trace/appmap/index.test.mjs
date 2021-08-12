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

const testAsync = async () => {
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
            exclude: [],
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
              this: { type: "string", print: "this-print" },
              arguments: [{ type: "string", print: "arg-print" }],
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
              version: "2020",
              engine: null,
            },
            frameworks: [],
            client: {
              name: "@appland/appmap-agent-js",
              url: "https://github.com/applandinc/appmap-agent-js",
              version: "0.0.0",
            },
            recorder: { name: "process" },
            recording: {
              defined_class: "defined-class",
              method_id: "method-id",
            },
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
              id: 2 * indexes.event1,
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
