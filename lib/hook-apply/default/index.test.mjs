/* globals $uuid */

import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import HookApply from "./index.mjs";

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookApply, unhookApply } = HookApply(dependencies);
  const default_serial = {
    type: null,
    index: null,
    constructor: null,
    truncated: false,
    print: null,
    specific: null,
  };
  assertDeepEqual(
    await testHookAsync(
      hookApply,
      unhookApply,
      { conf: { hooks: { apply: false } } },
      async () => {},
    ),
    [],
  );
  assertDeepEqual(
    await testHookAsync(
      hookApply,
      unhookApply,
      { conf: { hooks: { apply: true }, "hidden-identifier": "$" } },
      async () => {
        const index = $uuid.beforeApply("function", 123, [456]);
        $uuid.afterApply(index, null, 789);
      },
    ),
    [
      {
        type: "send",
        data: {
          type: "event",
          data: {
            type: "before",
            index: 1,
            data: {
              type: "apply",
              function: "function",
              this: { ...default_serial, type: "number", print: "123" },
              arguments: [{ ...default_serial, type: "number", print: "456" }],
            },
            group: 0,
            time: 0,
          },
        },
      },
      {
        type: "send",
        data: {
          type: "event",
          data: {
            type: "after",
            index: 1,
            data: {
              type: "apply",
              error: { ...default_serial, type: "null", print: "null" },
              result: { ...default_serial, type: "number", print: "789" },
            },
            group: 0,
            time: 0,
          },
        },
      },
    ],
  );
};

testAsync();
