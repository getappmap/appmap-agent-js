import { EventEmitter } from "events";
import "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { main } from "./index.mjs?env=test";

const {
  Error,
  Object: { assign },
} = globalThis;

const configuration = createConfiguration("file:///home");

{
  const emitter = assign(new EventEmitter(), {
    cwd: () => "cwd",
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
      "file:///base",
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
