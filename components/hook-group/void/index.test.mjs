import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookGroup from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    HookGroup,
    { configuration: { ordering: "chronological" } },
    (_agent) => null,
  ),
  [],
);
