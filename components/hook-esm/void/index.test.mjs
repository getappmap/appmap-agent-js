import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookEsm from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    HookEsm,
    { configuration: { hooks: { esm: false } } },
    (_state) => null,
  ),
  [],
);
