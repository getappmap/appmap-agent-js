import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderEmpty from "./index.mjs";

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const { mainAsync } = RecorderEmpty(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("/repository");

{
  const emitter = new EventEmitter();
  const promise = mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "empty",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "/directory",
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
  assertDeepEqual(
    (await promise).map(([type]) => type),
    ["initialize", "terminate"],
  );
}
