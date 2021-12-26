import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import { makeAbsolutePath } from "../../__fixture__.mjs";
import RecorderEmpty from "./index.mjs";

const { main } = RecorderEmpty(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration(makeAbsolutePath("repository"));

{
  const emitter = Object.assign(new EventEmitter(), {
    cwd: () => makeAbsolutePath("cwd"),
    argv: ["node", "main.mjs"],
    version: "v1.2.3",
  });
  main(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "remote",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      makeAbsolutePath("directory"),
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
