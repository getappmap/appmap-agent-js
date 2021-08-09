/* globals $uuid */

import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookApply from "./index.mjs";

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookApply, unhookApply } = HookApply(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookApply,
      unhookApply,
      { hooks: { apply: false } },
      async () => {},
    ),
    [],
  );
  assertDeepEqual(
    await testHookAsync(
      hookApply,
      unhookApply,
      { hooks: { apply: true }, "hidden-identifier": "$" },
      async () => {
        const index = $uuid.recordBeforeApply("function", 123, [456]);
        $uuid.recordAfterApply(index, null, 789);
      },
    ),
    [
      {
        type: "trace",
        data: {
          type: "event",
          data: {
            type: "before",
            index: 1,
            data: {
              type: "apply",
              function: "function",
              this: { type: "number", print: "123" },
              arguments: [{ type: "number", print: "456" }],
            },
            group: 0,
            time: 0,
          },
        },
      },
      {
        type: "trace",
        data: {
          type: "event",
          data: {
            type: "after",
            index: 1,
            data: {
              type: "apply",
              error: { type: "null", print: "null" },
              result: { type: "number", print: "789" },
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
