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

const testAsync = async () => {
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
  const makeJump = (index) => [
    {
      type: "trace",
      data: {
        type: "event",
        data: {
          type: "before",
          index,
          group: 0,
          time: 0,
          data: { type: "jump" },
        },
      },
    },
    {
      type: "trace",
      data: {
        type: "event",
        data: {
          type: "after",
          index,
          group: 0,
          time: 0,
          data: { type: "jump" },
        },
      },
    },
  ];
  assertDeepEqual(
    await testHookAsync(
      hookApply,
      unhookApply,
      { hooks: { apply: true }, "hidden-identifier": "$" },
      async () => {
        const index = $uuid.recordBeginApply("function", 123, [456]);
        await $uuid.recordAwait(Promise.resolve("await"));
        const yields = [];
        for (const element of $uuid.recordYield("yield")) {
          yields.push(element);
        }
        for (const element of $uuid.recordYieldAll(["yield1", "yield2"])) {
          yields.push(element);
        }
        assertDeepEqual(yields, ["yield", "yield1", "yield2"]);
        $uuid.recordEndApply(index, null, 789);
      },
    ),
    [
      {
        type: "trace",
        data: {
          type: "event",
          data: {
            type: "begin",
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
      ...makeJump(2),
      ...makeJump(3),
      ...makeJump(4),
      {
        type: "trace",
        data: {
          type: "event",
          data: {
            type: "end",
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
