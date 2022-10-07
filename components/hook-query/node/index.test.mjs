import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookQuery from "./index.mjs?env=test";

assertDeepEqual(
  await testHookAsync(
    HookQuery,
    { hooks: { mysql: false, pg: false, sqlite3: false } },
    (_agent) => null,
  ),
  [],
);
