import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../build.mjs";
import Classmap from "../classmap.mjs";
import Event from "./index.mjs";

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
const { compileEventTrace } = Event(dependencies);

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
      ],
      new Set([1, 2]),
      classmap,
    ),
    [
      {
        event: "call",
        id: 2,
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
        id: 3,
        thread_id: 0,
        parent_id: 2,
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
