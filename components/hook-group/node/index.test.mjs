import { assertDeepEqual } from "../../__fixture__.mjs";
// import { executionAsyncId } from "async_hooks";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookGroup from "./index.mjs";

const {
  Promise,
  setTimeout,
} = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = HookGroup(dependencies);

assertDeepEqual(
  await testHookAsync(
    component,
    { configuration: { ordering: "chronological" } },
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
  component,
  { configuration: { ordering: "causal" } },
  async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  },
);
