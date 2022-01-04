import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookQuery from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook");
const { hookQuery, unhookQuery } = HookQuery(dependencies);
assertDeepEqual(
  await testHookAsync(
    hookQuery,
    unhookQuery,
    { hooks: { mysql: false, pg: false, sqlite3: false } },
    async (frontend) => null,
  ),
  { events: [], sources: [] },
);
