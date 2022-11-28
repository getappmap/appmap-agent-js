import { fileURLToPath } from "node:url";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  doesSupportSource,
  doesSupportTokens,
  generateNodeHook,
} from "./node-recursive.mjs";

const { hookCommandSource, hookCommandTokens, hookEnvironment } =
  generateNodeHook("process");

const base = "file:///A:/base/";
const path = fileURLToPath("file:///A:/base/lib/node/recorder-process.mjs");

assertEqual(doesSupportSource("source"), true);

assertDeepEqual(hookCommandSource("source", "/bin/sh", base), ["source"]);

assertEqual(doesSupportTokens(["token"]), true);

assertDeepEqual(hookCommandTokens(["token"], base), ["token"]);

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${path}`,
  },
);
