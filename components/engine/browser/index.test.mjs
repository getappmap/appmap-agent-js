/* eslint-env node */

import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";

const {
  // fail: assertFail,
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

global.navigator = {
  userAgent: "name/version rest",
};

const { default: Engine } = await import("./index.mjs");

const { getEngine } = Engine(await buildTestDependenciesAsync(import.meta.url));

assertDeepEqual(getEngine(), {
  name: "name",
  version: "version",
});
