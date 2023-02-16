import { cwd, env } from "node:process";
import { EventEmitter } from "events";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import { mainAsync } from "./index.mjs";

const { setTimeout } = globalThis;

const cwd_url = convertPathToFileUrl(cwd());

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    "command-options": { shell: false },
  },
  cwd_url,
);

// single killed child
{
  const emitter = new EventEmitter();
  emitter.env = env;
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
          key: { command: ["node", "--eval", `setTimeout(() => {}, 5000)`] },
        },
      },
      cwd_url,
    ),
  );
}

// single child
{
  const emitter = new EventEmitter();
  emitter.env = env;
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        scenario: "^",
        scenarios: {
          key: {
            command: ["node", "--eval", `"success";`],
          },
        },
      },
      cwd_url,
    ),
  );
}

// multiple child
{
  const emitter = new EventEmitter();
  emitter.env = env;
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        scenario: "^",
        scenarios: {
          key1: {
            command: ["node", "--eval", `"success";`],
          },
          key2: {
            command: ["node", "--eval", `throw "failure";`],
          },
        },
      },
      cwd_url,
    ),
  );
}
