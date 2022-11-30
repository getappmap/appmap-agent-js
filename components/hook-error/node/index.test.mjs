import process from "node:process";
import { assertEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookError from "./index.mjs";

const { Error } = globalThis;

assertEqual(
  (
    await testHookAsync(HookError, {}, () => {
      process.emit("uncaughtExceptionMonitor", new Error("message"));
    })
  )[0].error.specific.message,
  "message",
);
