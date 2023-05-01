import process from "node:process";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logInfo, logErrorWhen, logWarningWhen } from "../../log/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import { extendConfigurationNode } from "../../configuration-accessor/index.mjs";
import { readGlobal } from "../../global/index.mjs";
import { assert } from "../../util/index.mjs";
import {
  createFrontend,
  flushContent,
  recordStartTrack,
  recordStopTrack,
} from "../../frontend/index.mjs";
import { hook, unhook } from "../../hook/index.mjs";
import {
  createThrottle,
  updateThrottle,
  throttleAsync,
} from "../../throttle/index.mjs";
import {
  openSocket,
  isSocketReady,
  sendSocket,
  closeSocket,
  addSocketListener,
} from "../../socket/index.mjs";

const {
  Promise,
  undefined,
  parseInt,
  Map,
  Array: { from: toArray },
  Reflect: { defineProperty },
} = globalThis;

// (node:73778) TimeoutOverflowWarning: Infinity does not fit into a 32-bit signed integer.
const TIMEOUT = 2 ** 30;

const getName = ({ name }) => name;

function showTrackMap() {
  return toArray(this.values()).map(getName);
}

export const recordAsync = (configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  if (configuration.session === null) {
    configuration = { ...configuration, session: getUuid() };
  }
  const { session } = configuration;
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
  const beforeAll = readGlobal("beforeAll");
  const beforeEach = readGlobal("beforeEach");
  const afterEach = readGlobal("afterEach");
  const afterAll = readGlobal("afterAll");
  const expect = readGlobal("expect");
  const frontend = createFrontend(configuration);
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
  const backup = hook(frontend, configuration);
  const socket = openSocket(configuration);
  const throttle = createThrottle(configuration);
  addSocketListener(socket, "message", (message) => {
    updateThrottle(throttle, parseInt(message));
  });
  const flush = () => {
    if (isSocketReady(socket)) {
      const content = flushContent(frontend);
      if (content !== null) {
        sendSocket(socket, content);
      }
    }
  };
  beforeAll(async () => {
    /* c8 ignore start */
    if (!isSocketReady(socket)) {
      await new Promise((resolve, reject) => {
        addSocketListener(socket, "error", reject);
        addSocketListener(socket, "open", resolve);
      });
    }
    /* c8 ignore stop */
    process.once("beforeExit", flush);
    process.on("exit", flush);
    process.on("uncaughtExceptionMonitor", flush);
  }, TIMEOUT);
  beforeEach(async function () {
    await throttleAsync(throttle);
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
      frontend,
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
    flush();
  }, TIMEOUT);
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
    recordStopTrack(frontend, track, {
      type: "test",
      // TODO: figure out how to fetch the status of the current test case
      passed: true,
    });
    flush();
  }, TIMEOUT);
  afterAll(async () => {
    unhook(backup);
    flush();
    closeSocket(socket);
    await new Promise((resolve, reject) => {
      addSocketListener(socket, "error", reject);
      addSocketListener(socket, "close", resolve);
    });
    process.off("beforeExit", flush);
    process.off("exit", flush);
    process.off("uncaughtExceptionMonitor", flush);
  }, TIMEOUT);
  return Promise.resolve(undefined);
};
