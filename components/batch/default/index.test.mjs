import { assertEqual } from "../../__fixture__.mjs";
import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Batch from "./index.mjs";

global.GLOBAL_SPY_SPAWN = (exec, argv, options) => {
  const emitter = new EventEmitter();
  emitter.kill = (signal) => {
    emitter.emit("close", null, signal);
  };
  assertEqual(exec, "/bin/sh");
  assertEqual(argv.length, 2);
  assertEqual(argv[0], "-c");
  const command = argv[1];
  if (command.startsWith("success")) {
    setTimeout(() => {
      emitter.emit("close", 0, null);
    }, 0);
  } else if (command.startsWith("failure")) {
    setTimeout(() => {
      emitter.emit("close", 1, null);
    }, 0);
  } else {
    assertEqual(command.startsWith("sleep"), true);
  }
  return emitter;
};

const { mainAsync } = Batch(
  await buildTestDependenciesAsync(import.meta.url, {
    spawn: "spy",
  }),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("file:///home");

// no child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(emitter, configuration);
}

// single killed child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  setTimeout(() => {
    emitter.emit("SIGINT");
  }, 0);
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        scenario: "^",
        scenarios: {
          key1: { command: "sleep remote" },
          key2: { command: "sleep mocha" },
        },
      },
      "file:///base",
    ),
  );
}

// single child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        scenario: "^",
        scenarios: { key: { command: "success" } },
      },
      "file:///base",
    ),
  );
}

// multiple child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        scenario: "^",
        scenarios: {
          key1: { command: "success" },
          key2: { command: "failure" },
        },
      },
      "file:///base",
    ),
  );
}
