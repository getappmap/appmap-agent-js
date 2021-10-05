import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderProcess from "./index.mjs";

const {
  // equal: assertEqual,
  // deepEqual: assertDeepEqual,
} = Assert;

const { main } = RecorderProcess(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("/repository");

{
  const emitter = new EventEmitter();
  main(
    emitter,
    extendConfiguration(
      configuration,
      {
        enabled: true,
        recorder: "process",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "/directory",
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
