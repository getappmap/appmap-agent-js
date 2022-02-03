import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookNativeModule from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = HookNativeModule(dependencies);
assertDeepEqual(
  await testHookAsync(
    component,
    { hooks: { esm: false, cjs: false } },
    async () => {},
  ),
  { sources: [], events: [] },
);
