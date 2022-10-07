import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookCjs from "./index.mjs?env=test";

assertDeepEqual(
  await testHookAsync(
    HookCjs,
    { configuration: { hooks: { cjs: false } } },
    (_state) => null,
  ),
  [],
);
