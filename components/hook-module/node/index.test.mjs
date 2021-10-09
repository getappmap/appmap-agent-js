import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookNativeModule from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

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
  { files: [], events: [] },
);
