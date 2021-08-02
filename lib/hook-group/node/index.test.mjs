import { strict as Assert } from "assert";
import { executionAsyncId } from "async_hooks";
import { buildTestAsync } from "../../../build/index.mjs";
import HookGroup from "./index.mjs";

const {
  ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook", "frontend"],
  });
  const {
    frontend: { recordAfterQuery },
    hook: { testHookAsync },
  } = dependencies;
  const { hookGroupAsync } = HookGroup(dependencies);
  let group1;
  const buffer = await testHookAsync(
    hookGroupAsync,
    { conf: { hooks: { group: true } } },
    (frontend) =>
      new Promise((resolve) => {
        setTimeout(() => {
          group1 = executionAsyncId();
          assertDeepEqual(recordAfterQuery(frontend, 123, {}), {
            type: "send",
            data: {
              type: "event",
              data: {
                type: "after",
                index: 123,
                data: { type: "query" },
                group: group1,
                time: 0,
              },
            },
          });
          resolve();
        }, 0);
      }),
  );
  assert(
    buffer.some(({ type, ...rest1 }) => {
      if (type === "send") {
        const {
          data: { type, ...rest2 },
        } = rest1;
        if (type === "group") {
          const {
            data: { group: group2 },
          } = rest2;
          return group1 === group2;
        }
      }
    }),
  );
};

testAsync();
