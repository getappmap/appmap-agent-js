import { strict as Assert } from "assert";
import { executionAsyncId } from "async_hooks";
import { buildDependenciesAsync, buildAllAsync } from "../../build.mjs";
import HookGroup from "./index.mjs";

const {
  ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const {
    hook: { testHookAsync },
    frontend: { recordAfterQuery },
  } = await buildAllAsync(["hook", "frontend"], "test");
  const { hookGroup, unhookGroup } = HookGroup(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookGroup,
      unhookGroup,
      { hooks: { group: false } },
      async () => {
        await new Promise((resolve) => {
          setTimeout(resolve);
        });
      },
    ),
    [],
  );
  {
    let group1;
    const buffer = await testHookAsync(
      hookGroup,
      unhookGroup,
      { hooks: { group: true } },
      (frontend) =>
        new Promise((resolve) => {
          setTimeout(() => {
            group1 = executionAsyncId();
            assertDeepEqual(recordAfterQuery(frontend, 123, { error: null }), {
              type: "send",
              data: {
                type: "event",
                data: {
                  type: "after",
                  index: 123,
                  data: {
                    type: "query",
                    error: {
                      type: "null",
                      print: "null",
                    },
                  },
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
  }
};

testAsync();
