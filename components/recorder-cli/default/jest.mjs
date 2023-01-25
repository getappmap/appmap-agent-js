import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { hook } from "../../hook/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import {
  openAgent,
  recordStartTrack,
  recordStopTrack,
} from "../../agent/index.mjs";

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
  let track = null;
  beforeEach(() => {
    assert(
      !logErrorWhen(
        track !== null,
        "Detected concurrent jest test cases %j",
        track,
      ),
      "Concurrent jest test cases",
      ExternalAppmapError,
    );
    // We cannot use a counter because another jest
    // agent may be running in a different context.
    track = `jest-${getUuid()}`;
    recordStartTrack(
      agent,
      track,
      {
        "map-name": expect.getState().currentTestName,
      },
      null,
    );
  });
  afterEach(() => {
    assert(
      !logErrorWhen(
        track === null,
        "Detected concurrent jest test cases %j",
        track,
      ),
      "Concurrent jest test cases",
      ExternalAppmapError,
    );
    recordStopTrack(agent, track, {
      type: "test",
      // TODO: figure out how to fetch the status of the current test case
      passed: true,
    });
    track = null;
  });
};
