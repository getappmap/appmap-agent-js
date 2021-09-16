import { strict as Assert } from "assert";
// import { executionAsyncId } from "async_hooks";
import {
  buildTestDependenciesAsync,
  buildTestComponentsAsync,
} from "../../build.mjs";
import HookGroup from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const {
  hook: { testHookAsync },
} = await buildTestComponentsAsync(["hook", "frontend"]);
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

setTimeout(() => {}, 100); // provide an unknown async id
await testHookAsync(
  hookGroup,
  unhookGroup,
  { hooks: { group: true } },
  async (frontend) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  },
);
