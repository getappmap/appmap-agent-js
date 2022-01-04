import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderProcess from "./index.mjs";

const { main } = RecorderProcess(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("file:///home");

{
  const emitter = Object.assign(new EventEmitter(), {
    cwd: () => "cwd",
    argv: ["node", "main.mjs"],
    version: "v1.2.3",
  });
  main(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "file:///base",
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
