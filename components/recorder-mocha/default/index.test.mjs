import { EventEmitter } from "events";
import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { createMochaHooks } from "./index.mjs?env=test";

const {
  process: { version },
  Error,
  Object: { assign },
} = globalThis;

const configuration = createConfiguration("file:///w:/home/");

const mock = {
  cwd: () => convertFileUrlToPath("file:///w:/cwd"),
  argv: ["node", "main.mjs"],
  version,
};

{
  const emitter = assign(new EventEmitter(), mock);
  createMochaHooks(
    emitter,
    extendConfiguration(
      configuration,
      { recorder: "mocha", "default-process": false, main: "foo.js" },
      "file:///w:/base/",
    ),
  );
}

{
  const emitter = assign(new EventEmitter(), mock);
  const { beforeEach, afterEach } = createMochaHooks(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "mocha",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "file:///w:/base/",
    ),
  );
  beforeEach.call({
    currentTest: {
      parent: {
        fullTitle: () => "full-title-1",
      },
    },
  });
  afterEach.call({
    currentTest: {
      state: "passed",
    },
  });
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
