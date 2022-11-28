import { fileURLToPath } from "node:url";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { generateNodeRecorder } from "./node-recursive.mjs";

const {
  name,
  recursive,
  doesSupportSource,
  doesSupportTokens,
  hookCommandSource,
  hookCommandTokens,
  hookEnvironment,
} = generateNodeRecorder("process");

const base = "file:///A:/base/";
const path = fileURLToPath("file:///A:/base/lib/node/recorder-process.mjs");

assertEqual(name, "process");

assertEqual(recursive, true);

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
