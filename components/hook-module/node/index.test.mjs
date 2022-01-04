import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookNativeModule from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook");
const { hookModule, unhookModule } = HookNativeModule(dependencies);
assertDeepEqual(
  await testHookAsync(
    hookModule,
    unhookModule,
    { hooks: { esm: false, cjs: false } },
    async () => {},
  ),
  { sources: [], events: [] },
);
