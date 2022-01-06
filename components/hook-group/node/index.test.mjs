import { assertDeepEqual } from "../../__fixture__.mjs";
// import { executionAsyncId } from "async_hooks";
import {
  buildTestDependenciesAsync,
  buildTestComponentsAsync,
} from "../../build.mjs";
import HookGroup from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const {
  hook: { testHookAsync },
} = await buildTestComponentsAsync(["hook", "frontend"]);
const { hookGroup, unhookGroup } = HookGroup(dependencies);

assertDeepEqual(
  await testHookAsync(
    hookGroup,
    unhookGroup,
    { ordering: "chronological" },
    async () => {
      await new Promise((resolve) => {
        setTimeout(resolve);
      });
    },
  ),
  { sources: [], events: [] },
);

setTimeout(() => {}, 100); // provide an unknown async id
await testHookAsync(
  hookGroup,
  unhookGroup,
  { ordering: "causal" },
  async (frontend) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  },
);
