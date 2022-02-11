import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Hook from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = Hook(dependencies);

assertDeepEqual(
  await testHookAsync(
    component,
    {
      ordering: "chronological",
      hooks: {
        apply: false,
        mysql: false,
        pg: false,
        sqlite3: false,
        cjs: false,
        esm: false,
        http: false,
      },
    },
    async () => {},
  ),
  { sources: [], events: [] },
);
