import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookModule from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const { transformSourceDefault, ...component } = HookModule(dependencies);
assertEqual(
  transformSourceDefault("content", "context", (x) => x),
  "content",
);
assertDeepEqual(
  await testHookAsync(
    component,
    { hooks: { cjs: false, esm: false } },
    async (state) => null,
  ),
  { sources: [], events: [] },
);
