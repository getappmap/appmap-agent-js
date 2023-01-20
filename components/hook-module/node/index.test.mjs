import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookModule from "./index.mjs";

for (const recorder of ["process", "jest"]) {
  assertDeepEqual(
    await testHookAsync(
      HookModule,
      {
        configuration: {
          recorder,
          hooks: { esm: false, cjs: false },
        },
        url: "protocol://host/base",
      },
      () => {},
    ),
    [],
  );
}
