/* globals $uuid */

import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookApply from "./index.mjs";

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook");
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
      const index1 = $uuid.recordBeginApply("function", 123, [456]);
      const index2 = $uuid.recordBeforeJump();
      $uuid.recordAfterJump(index2);
      $uuid.recordEndApply(index1, null, 789);
    },
  ),
  [
    [
      "event",
      "begin",
      1,
      0,
      "apply",
      {
        function: "function",
        this: { type: "number", print: "123" },
        arguments: [{ type: "number", print: "456" }],
      },
    ],
    ["event", "before", 2, 0, "jump", null],
    ["event", "after", 2, 0, "jump", null],
    [
      "event",
      "end",
      1,
      0,
      "apply",
      {
        error: { type: "null", print: "null" },
        result: { type: "number", print: "789" },
      },
    ],
  ],
);
