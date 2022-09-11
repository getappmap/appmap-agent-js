import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookGroup from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = HookGroup(dependencies);
assertDeepEqual(
  await testHookAsync(
    component,
    { configuration: { ordering: "chronological" } },
    (_agent) => null,
  ),
  [],
);
