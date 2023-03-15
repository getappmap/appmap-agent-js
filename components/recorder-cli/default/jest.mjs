import { ExternalAppmapError } from "../../error/index.mjs";
import { logInfo, logErrorWhen, logWarningWhen } from "../../log/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { hook } from "../../hook/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import { extendConfigurationNode } from "../../configuration-accessor/index.mjs";
import { readGlobal } from "../../global/index.mjs";
import { assert } from "../../util/index.mjs";
import {
  openAgent,
  getSession,
  recordStartTrack,
  recordStopTrack,
} from "../../agent/index.mjs";

const {
  Map,
  Array: { from: toArray },
  Reflect: { defineProperty },
} = globalThis;

const getName = ({ name }) => name;

function showTrackMap() {
  return toArray(this.values()).map(getName);
}

export const record = (process, configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  logInfo(
    "Recording jest test cases of process #%j -- %j",
    process.pid,
    process.argv,
  );
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
  const beforeEach = readGlobal("beforeEach");
  const afterEach = readGlobal("afterEach");
  const expect = readGlobal("expect");
  const agent = openAgent(configuration);
  const session = getSession(agent);
  // Jest is claiming that it is running the tests from a given file serially.
  // However we detected nested calls of beforeEach / afterEach in practice.
  // So we need to maintain a set of track ids instead of a single one.
  const tracks = new Map();
  defineProperty(tracks, "toJSON", {
    __proto__: null,
    writable: true,
    configurable: true,
    enumerable: true,
    value: showTrackMap,
  });
  hook(agent, configuration);
  beforeEach(function () {
    assert(
      !logErrorWhen(
        tracks.has(this),
        "Duplicate beforeEach test context %o in %j",
        this,
        tracks,
      ),
      "Duplicate beforeEach test context",
      ExternalAppmapError,
    );
    // We cannot use a counter because another jest
    // agent may be running in a different context.
    const track = `jest-${getUuid()}`;
    const name = expect.getState().currentTestName;
    tracks.set(this, { track, name });
    logWarningWhen(
      tracks.size > 1,
      "Detected concurrent jest tests (beforeEach): %j",
      tracks,
    );
    recordStartTrack(
      agent,
      track,
      extendConfiguration(
        configuration,
        {
          "map-name": name,
          sessions: session,
        },
        null,
      ),
    );
  });
  afterEach(function () {
    assert(
      !logErrorWhen(
        !tracks.has(this),
        "Missing afterEach test context %o in %j",
        this,
        tracks,
      ),
      "Missing after test context",
      ExternalAppmapError,
    );
    logWarningWhen(
      tracks.size > 1,
      "Detected concurrent jest tests (afterEach): %j",
      tracks,
    );
    const { track } = tracks.get(this);
    tracks.delete(this);
    recordStopTrack(agent, track, {
      type: "test",
      // TODO: figure out how to fetch the status of the current test case
      passed: true,
    });
  });
};
