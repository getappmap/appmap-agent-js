import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookGroup from "./index.mjs?env=test";

assertDeepEqual(
  await testHookAsync(
    HookGroup,
    { configuration: { ordering: "chronological" } },
    (_agent) => null,
  ),
  [],
);
