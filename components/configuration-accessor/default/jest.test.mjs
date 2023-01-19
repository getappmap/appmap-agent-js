import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { fileURLToPath } from "node:url";
import { doesSupport, hookCommandAsync, hookEnvironment } from "./jest.mjs";

const base = "file:///A:/base/";
const recorder_path = fileURLToPath("file:///A:/base/lib/node/recorder.mjs");
const loader_url = "file:///A:/base/lib/node/loader-esm.mjs";

//////////////////
// mocha --argv //
//////////////////


assertEqual(doesSupport(["jest", "--argv"]), true);
assertDeepEqual(await hookCommandAsync(["jest", "--argv"], base), [
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
    NODE_OPTIONS: `options --experimental-vm-modules --experimental-loader=${loader_url}`,
  },
);
