/* globals $uuid */

import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import HookApply from "./index.mjs";

const _undefined = undefined;
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookApplyAsync } = HookApply(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookApplyAsync,
      { conf: { hooks: { apply: true }, "hidden-identifier": "$" } },
      async () => {
        const index = $uuid.beforeApply("function", 123, [456]);
        assertEqual($uuid.afterApply(index, null, 789), _undefined);
      },
    ),
    [
      {
        type: "send",
        session: "uuid",
        data: {
          type: "event",
          data: {
            type: "before",
            index: 1,
            data: {
              type: "apply",
              function: "function",
              this: { type: "number", value: 123 },
              arguments: [{ type: "number", value: 456 }],
            },
            group: 0,
            time: 0,
          },
        },
      },
      {
        type: "send",
        session: "uuid",
        data: {
          type: "event",
          data: {
            type: "after",
            index: 1,
            data: {
              type: "apply",
              error: { type: "null" },
              result: { type: "number", value: 789 },
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
