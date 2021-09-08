import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Callstack from "./callstack.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // throws: assertThrows,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { frameCallstack } = Callstack(dependencies);
  const default_event = {
    type: null,
    time: 0,
    group: 0,
    index: null,
    data: null,
  };
  const default_bundle_event = {
    ...default_event,
    data: { type: "bundle" },
  };
  const default_jump_event = {
    ...default_event,
    data: { type: "jump" },
  };
  const default_begin_event = {
    ...default_bundle_event,
    type: "begin",
  };
  const default_end_event = {
    ...default_bundle_event,
    type: "end",
  };
  const default_before_event = {
    ...default_jump_event,
    type: "before",
  };
  const default_after_event = {
    ...default_jump_event,
    type: "after",
  };
  const makeRootFrame = (between) => ({
    type: "bundle",
    begin: { ...default_begin_event, index: 0 },
    between,
    end: null,
  });
  const makeBundleFrame = (index, between) => ({
    type: "bundle",
    begin: { ...default_begin_event, index },
    between,
    end: { ...default_end_event, index },
  });
  const makeJumpFrame = (index) => ({
    type: "jump",
    before: { ...default_before_event, index },
    after: { ...default_after_event, index },
  });
  // bundle //
  assertDeepEqual(
    frameCallstack([
      { ...default_begin_event, index: 1 },
      { ...default_begin_event, index: 2 },
      { ...default_end_event, index: 2 },
      { ...default_end_event, index: 1 },
    ]),
    makeRootFrame([makeBundleFrame(1, [makeBundleFrame(2, [])])]),
  );
  // jump //
  assertDeepEqual(
    frameCallstack([
      { ...default_begin_event, index: 1 },
      { ...default_before_event, index: 1 },
      { ...default_begin_event, index: 2 },
      { ...default_after_event, index: 1 },
      { ...default_begin_event, index: 3 },
      { ...default_end_event, index: 3 },
      { ...default_end_event, index: 1 },
      { ...default_end_event, index: 2 },
    ]),
    makeRootFrame([
      makeBundleFrame(1, [makeJumpFrame(1), makeBundleFrame(3, [])]),
      makeBundleFrame(2, []),
    ]),
  );

  //
  //   compileEventTrace(
  //     [
  //       { ...default_before_event, index: 1 },
  //       { ...default_before_event, index: 2 },
  //       { ...default_after_event, index: 1 },
  //       { ...default_after_event, index: 2 },
  //     ],
  //     classmap,
  //   ),
  //   [
  //     { ...default_call_event, id: 2 },
  //     { ...default_call_event, id: 4 },
  //     { ...default_return_event, id: 5, parent_id: 4 },
  //     { ...default_return_event, id: 3, parent_id: 2 },
  //   ],
  // );
  // // flip order //
  // assertDeepEqual(
  //   compileEventTrace(
  //     [
  //       { ...default_after_event, index: 1 },
  //       { ...default_before_event, index: 2 },
  //       { ...default_after_event, index: 2 },
  //       { ...default_before_event, index: 1 },
  //     ],
  //     classmap,
  //   ),
  //   [
  //     { ...default_call_event, id: 2 },
  //     { ...default_call_event, id: 4 },
  //     { ...default_return_event, id: 5, parent_id: 4 },
  //     { ...default_return_event, id: 3, parent_id: 2 },
  //   ],
  // );
  // // manufacture missing event //
  // assertDeepEqual(
  //   compileEventTrace(
  //     [
  //       { ...default_after_event, index: 1 },
  //       { ...default_before_event, index: 2 },
  //     ],
  //     classmap,
  //   ),
  //   [
  //     { ...default_call_event, id: 2 },
  //     { ...default_call_event, id: 4 },
  //     { ...default_return_event, id: 5, parent_id: 4 },
  //     { ...default_return_event, id: 3, parent_id: 2 },
  //   ],
  // );
  // // collapseShallow //
  // {
  //   const testCollapse = (shallow) => {
  //     const classmap = createClassmap(createConfiguration("/cwd"));
  //     addClassmapFile(classmap, {
  //       index: 123,
  //       path: "/cwd/filename.js",
  //       type: "script",
  //       code: "function f (x) {}",
  //       exclude: [],
  //       shallow,
  //     });
  //     const default_before_apply_event = {
  //       ...default_before_event,
  //       data: {
  //         type: "apply",
  //         function: "123/body/0",
  //         this: { type: "string", print: "print-this" },
  //         arguments: [{ type: "string", print: "print-arg" }],
  //       },
  //     };
  //     const default_after_apply_event = {
  //       ...default_after_event,
  //       data: {
  //         type: "apply",
  //         error: null,
  //         result: { type: "string", print: "print" },
  //       },
  //     };
  //     const { length } = compileEventTrace(
  //       [
  //         {
  //           ...default_before_event,
  //           index: 1,
  //         },
  //         {
  //           ...default_before_apply_event,
  //           index: 2,
  //         },
  //         {
  //           ...default_before_apply_event,
  //           index: 3,
  //         },
  //         {
  //           ...default_after_apply_event,
  //           index: 3,
  //         },
  //         {
  //           ...default_after_apply_event,
  //           index: 2,
  //         },
  //         {
  //           ...default_after_event,
  //           index: 1,
  //         },
  //       ],
  //       classmap,
  //     );
  //     assertEqual(length, shallow ? 4 : 6);
  //   };
  //   testCollapse(false);
  //   testCollapse(true);
  // }
};

testAsync();
