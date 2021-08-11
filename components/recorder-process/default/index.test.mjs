import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderProcess from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const { mainAsync } = RecorderProcess(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("/repository");

// disabled
{
  const emitter = new EventEmitter();
  emitter.cwd = () => "/cwd";
  emitter.argv = ["node", "main.mjs"];
  const promise = mainAsync(emitter, configuration);
  assertEqual(await promise, null);
}

// enabled
{
  const emitter = new EventEmitter();
  emitter.cwd = () => "/cwd";
  emitter.argv = ["node", "main.mjs"];
  const promise = mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      { enabled: true, hooks: { cjs: false, esm: false, http: false } },
      "/directory",
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
  assertDeepEqual(
    (await promise).map(({ type }) => type),
    ["initialize", "trace", "trace", "terminate"],
  );
}
