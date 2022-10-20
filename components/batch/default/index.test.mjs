import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { EventEmitter } from "events";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { mainAsync } from "./index.mjs?env=test";

const { setTimeout } = globalThis;

globalThis.GLOBAL_SPY_SPAWN = (exec, argv, _options) => {
  const emitter = new EventEmitter();
  emitter.kill = (signal) => {
    emitter.emit("close", null, signal);
  };
  assertDeepEqual(argv, []);
  if (exec === "success") {
    setTimeout(() => {
      emitter.emit("close", 0, null);
    }, 0);
  } else if (exec === "failure") {
    setTimeout(() => {
      emitter.emit("close", 1, null);
    }, 0);
  } else {
    assertEqual(exec, "sleep");
  }
  return emitter;
};

const configuration = createConfiguration("protocol://host/home");

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
          key1: { command: "sleep" },
          key2: { command: "sleep" },
        },
      },
      "protocol://host/base",
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
        scenarios: {
          key: {
            command: "success",
          },
        },
      },
      "protocol://host/base",
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
          key1: {
            command: "success",
          },
          key2: {
            command: "failure",
          },
        },
      },
      "protocol://host/base",
    ),
  );
}
