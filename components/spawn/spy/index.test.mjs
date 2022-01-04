/* eslint-env node */

import { assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

global.GLOBAL_SPY_SPAWN = (exec, argv, options) => ({ exec, argv, options });
global.GLOBAL_SPY_FORK = (path, argv, options) => ({ path, argv, options });
const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { spawn, fork } = Spawn(dependencies);
assertDeepEqual(spawn("exec", ["argv0"], {}), {
  exec: "exec",
  argv: ["argv0"],
  options: {},
});
assertDeepEqual(fork("path", ["argv0"], {}), {
  path: "path",
  argv: ["argv0"],
  options: {},
});
