import process from "node:process";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookError from "./index.mjs";

assertDeepEqual(
  await testHookAsync(HookError, {}, () => {
    process.emit("exit", 0);
  }),
  [],
);

process.exit(0);
