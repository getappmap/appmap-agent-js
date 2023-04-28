import process from "node:process";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookExit from "./index.mjs";

assertDeepEqual(
  await testHookAsync(HookExit, {}, () => {
    process.emit("exit", 0);
  }),
  [
    {
      type: "stop",
      track: null,
      termination: { type: "exit", status: 0 },
    },
  ],
);

process.exitCode = 0;
