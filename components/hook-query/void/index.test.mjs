import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookQuery from "./index.mjs?env=test";

assertDeepEqual(
  await testHookAsync(
    HookQuery,
    { configuration: { hooks: { mysql: false, sqlite3: false, pg: false } } },
    (_agent) => null,
  ),
  [],
);
