import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { hook } from "../../hook/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import {
  openAgent,
  recordStartTrack,
  recordStopTrack,
} from "../../agent/index.mjs";

const { String } = globalThis;

export const record = (configuration) => {
  // I would prefer to use require rather that global variable:
  //
  // const { beforeEach, afterEach, expect } = requirePeerDependency(
  //   "@jest/globals",
  //   {
  //     directory: configuration.repository.directory,
  //     strict: true,
  //   },
  // );
  //
  // But this breaks an invariant in Jest:
  //
  // Error: There should always be a Jest object already
  //
  // Which might be a bug in jest related to `createRequire`.
  for (const name of ["beforeEach", "afterEach", "expect"]) {
    assert(
      !logErrorWhen(
        !hasOwnProperty(globalThis, "beforeEach"),
        "Missing jest-related global variable: %s",
        name,
      ),
      "Missing jest-related global variable",
      ExternalAppmapError,
    );
  }
  const { beforeEach, afterEach, expect } = globalThis;
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
