import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Classmap from "./classmap.mjs";
import Event from "./event.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // throws: assertThrows,
  equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createConfiguration } = await buildTestComponentAsync(
    "configuration",
  );
  const { createClassmap, addClassmapFile } = Classmap(dependencies);
  const { compileEventTrace } = Event(dependencies);
  const classmap = createClassmap(createConfiguration("/cwd"));
  const default_before_event = {
    type: "before",
    time: 0,
    index: null,
    data: { type: "test" },
  };
  const default_after_event = {
    type: "after",
    time: 0,
    index: null,
    data: { type: "test" },
  };
  const default_call_event = {
    event: "call",
    thread_id: 0,
    id: null,
  };
  const default_return_event = {
    event: "return",
    thread_id: 0,
    id: null,
    elapsed: 0,
    parent_id: null,
  };
  // sort return //
  assertDeepEqual(
    compileEventTrace(
      [
        { ...default_before_event, index: 1 },
        { ...default_before_event, index: 2 },
        { ...default_after_event, index: 1 },
        { ...default_after_event, index: 2 },
      ],
      classmap,
    ),
    [
      { ...default_call_event, id: 2 },
      { ...default_call_event, id: 4 },
      { ...default_return_event, id: 5, parent_id: 4 },
      { ...default_return_event, id: 3, parent_id: 2 },
    ],
  );
  // flip order //
  assertDeepEqual(
    compileEventTrace(
      [
        { ...default_after_event, index: 1 },
        { ...default_before_event, index: 2 },
        { ...default_after_event, index: 2 },
        { ...default_before_event, index: 1 },
      ],
      classmap,
    ),
    [
      { ...default_call_event, id: 2 },
      { ...default_call_event, id: 4 },
      { ...default_return_event, id: 5, parent_id: 4 },
      { ...default_return_event, id: 3, parent_id: 2 },
    ],
  );
  // manufacture missing event //
  assertDeepEqual(
    compileEventTrace(
      [
        { ...default_after_event, index: 1 },
        { ...default_before_event, index: 2 },
      ],
      classmap,
    ),
    [
      { ...default_call_event, id: 2 },
      { ...default_call_event, id: 4 },
      { ...default_return_event, id: 5, parent_id: 4 },
      { ...default_return_event, id: 3, parent_id: 2 },
    ],
  );
  // collapseShallow //
  {
    const testCollapse = (shallow) => {
      const classmap = createClassmap(createConfiguration("/cwd"));
      addClassmapFile(classmap, {
        index: 123,
        path: "/cwd/filename.js",
        type: "script",
        code: "function f (x) {}",
        exclude: [],
        shallow,
      });
      const default_before_apply_event = {
        ...default_before_event,
        data: {
          type: "apply",
          function: "123/body/0",
          this: { type: "string", print: "print-this" },
          arguments: [{ type: "string", print: "print-arg" }],
        },
      };
      const default_after_apply_event = {
        ...default_after_event,
        data: {
          type: "apply",
          error: null,
          result: { type: "string", print: "print" },
        },
      };
      const { length } = compileEventTrace(
        [
          {
            ...default_before_event,
            index: 1,
          },
          {
            ...default_before_apply_event,
            index: 2,
          },
          {
            ...default_before_apply_event,
            index: 3,
          },
          {
            ...default_after_apply_event,
            index: 3,
          },
          {
            ...default_after_apply_event,
            index: 2,
          },
          {
            ...default_after_event,
            index: 1,
          },
        ],
        classmap,
      );
      assertEqual(length, shallow ? 4 : 6);
    };
    testCollapse(false);
    testCollapse(true);
  }
};

testAsync();
