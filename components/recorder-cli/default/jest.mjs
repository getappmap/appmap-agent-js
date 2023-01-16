import { createRequire } from "node:module";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen, logError } from "../../log/index.mjs";
import { hook } from "../../hook/index.mjs";
import { assert } from "../../util/index.mjs";
import {
  openAgent,
  recordStartTrack,
  recordStopTrack,
} from "../../agent/index.mjs";

const { String } = globalThis;

export const record = (configuration) => {
  let Jest = null;
  const require = createRequire(import.meta.url);
  try {
    Jest = require("@jest/globals");
  } /* c8 ignore start */ catch (error) {
    logError("Failed to load @jest/globals module >> %o", error);
    throw new ExternalAppmapError("Failed to load @jest/globals module");
  } /* c8 ignore stop */
  const { beforeEach, afterEach, expect } = Jest;
  const agent = openAgent(configuration);
  hook(agent, configuration);
  let running = null;
  let counter = 0;
  beforeEach(() => {
    const name = expect.getState().currentTestName;
    assert(
      !logErrorWhen(
        running !== null,
        "Detected conccurent jest test cases: %j and %j",
        running,
        name,
      ),
      "Concurrent jest test cases",
      ExternalAppmapError,
    );
    running = name;
    counter += 1;
    recordStartTrack(
      agent,
      `jest-${String(counter)}`,
      {
        "map-name": name,
      },
      null,
    );
  });
  afterEach(() => {
    recordStopTrack(agent, `jest-${String(counter)}`, {
      type: "test",
      // TODO: figure out how to fetch the status of the current test case
      passed: true,
    });
    running = null;
  });
};
