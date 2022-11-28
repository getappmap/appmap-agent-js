import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { fileURLToPath } from "node:url";
import {
  doesSupportSource,
  doesSupportTokens,
  hookCommandSource,
  hookCommandTokens,
  hookEnvironment,
} from "./jest.mjs";

const base = "file:///A:/base/";
const recorder_path = fileURLToPath(
  "file:///A:/base/lib/node/recorder-jest.mjs",
);
const loader_path = fileURLToPath(
  "file:///A:/base/lib/node/loader-standalone.mjs",
);

//////////////////
// mocha --argv //
//////////////////

// source //
assertEqual(doesSupportSource("jest --argv"), true);
assertDeepEqual(hookCommandSource("jest --argv", "/bin/sh", base), [
  `jest --runInBand --setupFilesAfterEnv ${recorder_path} --argv`,
]);

// tokens //
assertEqual(doesSupportTokens(["jest", "--argv"]), true);
assertDeepEqual(hookCommandTokens(["jest", "--argv"], base), [
  "jest",
  "--runInBand",
  "--setupFilesAfterEnv",
  recorder_path,
  "--argv",
]);

/////////////////////
// hookEnvironment //
/////////////////////

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-vm-modules --experimental-loader=${loader_path}`,
  },
);
