/* eslint-env node */

import { assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";

globalThis.navigator = {
  userAgent: "name/version rest",
};

const { default: Engine } = await import("./index.mjs");

const { getEngine } = Engine(await buildTestDependenciesAsync(import.meta.url));

assertDeepEqual(getEngine(), "name@version");
