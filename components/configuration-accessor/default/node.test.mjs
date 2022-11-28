import { fileURLToPath } from "node:url";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  doesSupportSource,
  doesSupportTokens,
  generateNodeHook,
} from "./node.mjs";

const { hookCommandSource, hookCommandTokens, hookEnvironment } =
  generateNodeHook("process");

const base = "file:///A:/base/";
const recorder_path = fileURLToPath(
  "file:///A:/base/lib/node/recorder-process.mjs",
);

assertEqual(doesSupportSource("node.ext main.mjs"), true);
assertDeepEqual(hookCommandSource("node.ext main.mjs", "/bin/sh", base), [
  `node.ext --experimental-loader ${recorder_path} main.mjs`,
]);

assertEqual(doesSupportTokens(["node.ext", "main.mjs"]), true);
assertDeepEqual(hookCommandTokens(["node.ext", "main.mjs"], base), [
  "node.ext",
  "--experimental-loader",
  recorder_path,
  "main.mjs",
]);

assertDeepEqual(hookEnvironment({ FOO: "bar" }, base), { FOO: "bar" });
