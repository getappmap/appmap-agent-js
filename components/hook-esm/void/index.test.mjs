import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookEsm from "./index.mjs?env=test";

assertDeepEqual(
  await testHookAsync(
    HookEsm,
    { configuration: { hooks: { esm: false } } },
    (_state) => null,
  ),
  [],
);
