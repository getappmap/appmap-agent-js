import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookModule from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook");
const { hookModule, unhookModule, transformSourceDefault } =
  HookModule(dependencies);
assertEqual(
  transformSourceDefault("content", "context", (x) => x),
  "content",
);
assertDeepEqual(
  await testHookAsync(
    hookModule,
    unhookModule,
    { hooks: { cjs: false, esm: false } },
    async (state) => null,
  ),
  { sources: [], events: [] },
);
