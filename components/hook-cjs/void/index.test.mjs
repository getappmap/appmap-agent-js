import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookCjs from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    HookCjs,
    { configuration: { hooks: { cjs: false } } },
    (_state) => null,
  ),
  [],
);
