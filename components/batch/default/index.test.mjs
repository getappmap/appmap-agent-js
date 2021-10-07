import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Batch from "./index.mjs";

const {
  // equal: assertEqual,
  // fail: assertFail,
  // deepEqual: assertDeepEqual
} = Assert;

global.GLOBAL_SPY_SPAWN = (exec, argv, options) => {
  const emitter = new EventEmitter();
  emitter.kill = (signal) => {
    emitter.emit("close", null, signal);
  };
  if (exec === "success") {
    setTimeout(() => {
      emitter.emit("close", 0, null);
    }, 0);
  } else if (exec === "failure") {
    setTimeout(() => {
      emitter.emit("close", 1, null);
    }, 0);
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

const configuration = createConfiguration("/repository");

// no child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(emitter, configuration);
}

// // single success child
// {
//   const emitter = new EventEmitter();
//   emitter.env = {};
//   await mainAsync(
//     emitter,
//     extendConfiguration(
//       configuration,
//       {
//         scenario: "foo",
//         scenarios: { foo: ["success"], bar: ["failure"] },
//       },
//       "/directory",
//     ),
//   );
// }

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
        recorder: "process",
        scenario: "foo",
        scenarios: { foo: ["sleep"], bar: ["sleep"] },
      },
      "/directory",
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
        scenario: "^",
        scenarios: {
          name: [["success"], ["failure"]],
        },
      },
      "/directory",
    ),
  );
}
