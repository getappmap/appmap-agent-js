import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Classmap from "./classmap.mjs";
import Digest from "./digest.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createClassmap, addClassmapFile } = Classmap(dependencies);
const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);
const { digestTrace } = Digest(dependencies);

// Empty Bundle //
assertDeepEqual(
  digestTrace(
    {
      type: "bundle",
      begin: {
        type: "begin",
        index: 1,
        time: 0,
        data: {
          type: "bundle",
        },
      },
      between: [],
      end: {
        type: "end",
        index: 1,
        time: 0,
        data: {
          type: "bundle",
        },
      },
    },
    new Set([1]),
    createClassmap(createConfiguration("/cwd")),
  ),
  [],
);

// Empty Jump //
assertDeepEqual(
  digestTrace(
    {
      type: "jump",
      before: {
        type: "before",
        index: 1,
        time: 0,
        data: {
          type: "jump",
        },
      },
      after: {
        type: "after",
        index: 1,
        time: 0,
        data: {
          type: "jump",
        },
      },
    },
    new Set([1]),
    createClassmap(createConfiguration("/cwd")),
  ),
  [],
);

// Bundle && Shallow //
{
  const classmap = createClassmap(createConfiguration("/cwd"));
  addClassmapFile(classmap, {
    index: 123,
    path: "/cwd/filename.js",
    type: "script",
    code: "function f (x) {}",
    exclude: [],
    shallow: true,
  });
  const begin_apply_event = {
    type: "begin",
    index: null,
    time: 0,
    data: {
      type: "apply",
      function: "123/body/0",
      this: {
        type: "string",
        print: "this",
      },
      arguments: [
        {
          type: "string",
          print: "argument0",
        },
      ],
    },
  };
  const end_apply_event = {
    type: "end",
    index: null,
    time: 0,
    data: {
      type: "apply",
      error: null,
      result: {
        type: "string",
        print: "result",
      },
    },
  };
  assertDeepEqual(
    digestTrace(
      {
        type: "bundle",
        begin: {
          ...begin_apply_event,
          index: 1,
          time: 3,
        },
        between: [
          {
            type: "bundle",
            begin: {
              ...begin_apply_event,
              index: 2,
            },
            between: [],
            end: {
              ...end_apply_event,
              index: 2,
            },
          },
        ],
        end: {
          ...end_apply_event,
          index: 1,
          time: 10,
        },
      },
      new Set([1, 2]),
      classmap,
    ),
    [
      {
        event: "call",
        id: 1,
        thread_id: 0,
        defined_class: "f",
        method_id: "()",
        path: "filename.js",
        lineno: 1,
        static: false,
        receiver: {
          name: "this",
          class: "string",
          object_id: null,
          value: "this",
        },
        parameters: [
          {
            name: "x",
            class: "string",
            object_id: null,
            value: "argument0",
          },
        ],
      },
      {
        event: "return",
        id: 2,
        thread_id: 0,
        parent_id: 1,
        elapsed: 7,
        return_value: {
          name: "return",
          class: "string",
          object_id: null,
          value: "result",
        },
        exceptions: null,
      },
    ],
  );
}

// Missing Bundle //
assertDeepEqual(
  digestTrace(
    {
      type: "bundle",
      begin: {
        type: "begin",
        index: 1,
        time: 10,
        data: {
          type: "response",
          protocol: "HTTP/1.1",
          method: "GET",
          url: "/path",
          headers: {},
          route: null,
        },
      },
      between: [],
      end: null,
    },
    new Set([1]),
    createClassmap(createConfiguration("/cwd")),
  ),
  [
    {
      event: "call",
      id: 1,
      thread_id: 0,
      message: [],
      http_server_request: {
        authorization: null,
        headers: {},
        mime_type: null,
        normalized_path_info: null,
        path_info: "/path",
        protocol: "HTTP/1.1",
        request_method: "GET",
      },
    },
    {
      event: "return",
      id: 2,
      thread_id: 0,
      parent_id: 1,
      elapsed: 0,
      http_server_response: {
        status_code: 200,
        mime_type: null,
      },
    },
  ],
);

// Jump //
for (const completion of [true, false]) {
  assertDeepEqual(
    digestTrace(
      {
        type: "jump",
        before: {
          type: "before",
          index: 1,
          time: 3,
          data: {
            type: "query",
            database: "database",
            version: null,
            sql: "SELECT * FROM TABLE;",
            parameters: [],
          },
        },
        after: completion
          ? {
              type: "after",
              index: 1,
              time: 10,
              data: {
                type: "query",
                result: {},
              },
            }
          : null,
      },
      new Set([1]),
      createClassmap(createConfiguration("/cwd")),
    ),
    [
      {
        event: "call",
        id: 1,
        thread_id: 0,
        message: [],
        sql_query: {
          database_type: "database",
          server_version: null,
          sql: "SELECT * FROM TABLE;",
          explain_sql: null,
        },
      },
      {
        event: "return",
        id: 2,
        thread_id: 0,
        parent_id: 1,
        elapsed: completion ? 7 : 0,
      },
    ],
  );
}
