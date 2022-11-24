import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    {
      hook: (_agent, _configuration) => "hooking",
      unhook: (hooking) => {
        assertEqual(hooking, "hooking");
      },
    },
    {},
    async () => {},
  ),
  [],
);
