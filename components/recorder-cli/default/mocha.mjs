import { createRequire } from "node:module";
import { hooks } from "../../../lib/node/mocha-hook.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logError, logErrorWhen } from "../../log/index.mjs";
import { hook } from "../../hook/index.mjs";
import { assert } from "../../util/index.mjs";
import {
  openAgent,
  recordStartTrack,
  recordStopTrack,
} from "../../agent/index.mjs";
import { validateMocha } from "../../validate-mocha/index.mjs";

const { String } = globalThis;

export const record = (configuration) => {
  let Mocha = null;
  const require = createRequire(import.meta.url);
  try {
    Mocha = require("mocha");
  } /* c8 ignore start */ catch (error) {
    logError("Failed to load mocha module >> %o", error);
    throw new ExternalAppmapError("Failed to load mocha module");
  } /* c8 ignore stop */
  validateMocha(Mocha);
  const agent = openAgent(configuration);
  hook(agent, configuration);
  let running = null;
  let counter = 0;
  hooks.beforeEach = (context) => {
    const name = context.currentTest.parent.fullTitle();
    assert(
      !logErrorWhen(
        running !== null,
        "Detected conccurent mocha test cases: %j and %j",
        running,
        name,
      ),
      "Concurrent mocha test cases",
      ExternalAppmapError,
    );
    running = name;
    counter += 1;
    recordStartTrack(
      agent,
      `mocha-${String(counter)}`,
      {
        "map-name": name,
      },
      null,
    );
  };
  hooks.afterEach = (context) => {
    recordStopTrack(agent, `mocha-${String(counter)}`, {
      type: "test",
      passed: context.currentTest.state === "passed",
    });
    running = null;
  };
};
