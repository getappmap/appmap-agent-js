import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import HookFixture from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync, makeEvent } = HookFixture(dependencies);

assertEqual(
  typeof makeEvent("type", "index", "time", "data_type", "data_rest"),
  "object",
);
assertDeepEqual(
  await testHookAsync(
    {
      hook: (agent, configuration) => "hooking",
      unhook: (hooking) => {
        assertEqual(hooking, "hooking");
      },
    },
    {},
    async () => {},
  ),
  { sources: [], events: [] },
);
