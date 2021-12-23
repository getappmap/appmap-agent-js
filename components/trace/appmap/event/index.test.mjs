import { assertDeepEqual } from "../../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../build.mjs";
import Classmap from "../classmap/index.mjs";
import Event from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createClassmap, addClassmapSource } = Classmap(dependencies);
const { makeLocation, stringifyLocation } = await buildTestComponentAsync(
  "location",
);
const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);
const { compileEventTrace } = Event(dependencies);

{
  const classmap = createClassmap(createConfiguration("/cwd"));
  addClassmapSource(classmap, {
    url: "file:///cwd/filename.js",
    content: "function f (x) {}",
    inline: false,
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
    shallow: true,
  });
  const begin_apply_event = {
    type: "begin",
    index: null,
    time: 0,
    data: {
      type: "apply",
      function: stringifyLocation(
        makeLocation("file:///cwd/filename.js", 1, 0),
      ),
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
    compileEventTrace(
      [
        {
          ...begin_apply_event,
          index: 1,
          time: 3,
        },
        {
          ...begin_apply_event,
          index: 2,
        },
        {
          ...end_apply_event,
          index: 2,
        },
        {
          ...end_apply_event,
          index: 1,
          time: 10,
        },
        {
          type: "begin",
          index: 3,
          time: 0,
          data: {
            type: "query",
            database: "database",
            version: "version",
            sql: "sql",
            parameters: [],
          },
        },
        {
          type: "end",
          index: 3,
          time: 0,
          data: {
            type: "query",
          },
        },
      ],
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
        elapsed: 0.007,
        return_value: {
          name: "return",
          class: "string",
          object_id: null,
          value: "result",
        },
        exceptions: null,
      },
      {
        event: "call",
        id: 3,
        message: [],
        sql_query: {
          database_type: "database",
          explain_sql: null,
          server_version: "version",
          sql: "sql",
        },
        thread_id: 0,
      },
      {
        elapsed: 0,
        event: "return",
        id: 4,
        parent_id: 3,
        thread_id: 0,
      },
    ],
  );
}
