import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderMocha from "./index.mjs";

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const { createMochaHooks } = RecorderMocha(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("/repository");

{
  const emitter = new EventEmitter();
  emitter.cwd = () => "/cwd";
  emitter.argv = ["node", "main.mjs"];
  const { promise, beforeEach, afterEach } = createMochaHooks(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "mocha",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "/directory",
    ),
  );
  beforeEach.call({
    currentTest: {
      parent: {
        fullTitle: () => "full-title-1",
      },
    },
  });
  afterEach();
  beforeEach.call({
    currentTest: {
      parent: {
        fullTitle: () => "full-title-2",
      },
    },
  });
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
  assertDeepEqual(
    (await promise).map(([type]) => type),
    ["initialize", "start", "stop", "start", "stop", "terminate"],
  );
}
