import { EventEmitter } from "events";
import "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { createMochaHooks } from "./index.mjs?env=test";

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
  createMochaHooks(
    emitter,
    extendConfiguration(
      configuration,
      { recorder: "mocha", processes: false, main: "foo.js" },
      "file:///w:/base/",
    ),
  );
}

{
  const emitter = assign(new EventEmitter(), {
    cwd: () => "cwd",
    argv: ["node", "main.mjs"],
    version: "v1.2.3",
  });
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
  afterEach();
  // beforeEach.call({
  //   currentTest: {
  //     parent: {
  //       fullTitle: () => "full-title-2",
  //     },
  //   },
  // });
  emitter.emit("uncaughtExceptionMonitor", new Error("BOUM"));
  emitter.emit("exit", 123, "SIGINT");
}
