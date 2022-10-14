import { EventEmitter } from "events";
import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { main } from "./index.mjs?env=test";

const {
  process: { version },
  Error,
  Object: { assign },
} = globalThis;

const mock = {
  cwd: () => convertFileUrlToPath("file:///w:/cwd"),
  argv: ["node", "main.mjs"],
  version,
};

const configuration = createConfiguration("file:///w:/home/");

{
  const emitter = assign(new EventEmitter(), mock);
  main(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "remote",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "file:///w:/base/",
    ),
  );
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
