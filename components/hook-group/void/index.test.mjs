import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookGroup from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const { hookGroup, unhookGroup } = HookGroup(dependencies);
assertDeepEqual(
  await testHookAsync(
    hookGroup,
    unhookGroup,
    { ordering: "chronological" },
    async (frontend) => null,
  ),
  { sources: [], events: [] },
);
