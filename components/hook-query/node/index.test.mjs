import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookQuery from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = HookQuery(dependencies);
assertDeepEqual(
  await testHookAsync(
    component,
    { hooks: { mysql: false, pg: false, sqlite3: false } },
    (_agent) => null,
  ),
  [],
);
