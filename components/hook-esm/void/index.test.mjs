import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookModule from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = HookModule(dependencies);
assertDeepEqual(
  await testHookAsync(
    component,
    { configuration: { hooks: { esm: false } } },
    (_state) => null,
  ),
  [],
);
