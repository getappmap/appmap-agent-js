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
const { testHookAsync, makeEvent } = await buildTestComponentAsync("hook");
const { hookApply, unhookApply } = HookApply(dependencies);
assertDeepEqual(
  await testHookAsync(
    hookApply,
    unhookApply,
    { hooks: { apply: false } },
    async () => {},
  ),
  { files: [], events: [] },
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
  {
    files: [],
    events: [
      makeEvent("begin", 1, 0, "apply", {
        function: "function",
        this: { type: "number", print: "123" },
        arguments: [{ type: "number", print: "456" }],
      }),
      makeEvent("before", 2, 0, "jump", null),
      makeEvent("after", 2, 0, "jump", null),
      makeEvent("end", 1, 0, "apply", {
        error: { type: "null", print: "null" },
        result: { type: "number", print: "789" },
      }),
    ],
  },
);
