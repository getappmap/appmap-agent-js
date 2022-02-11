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
    { hooks: { mysql: false, sqlite3: false, pg: false } },
    async (frontend) => null,
  ),
  { sources: [], events: [] },
);
