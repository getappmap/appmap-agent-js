import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookModule from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    HookModule,
    {
      configuration: {
        hooks: { esm: false, cjs: false },
      },
      url: "protocol://host/base",
    },
    () => {},
  ),
  [],
);
