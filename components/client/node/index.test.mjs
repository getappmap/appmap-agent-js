import { cwd, env } from "node:process";
import { EventEmitter } from "node:events";
import { assertEqual } from "../../__fixture__.mjs";
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

{
  const emitter = new EventEmitter();
  emitter.env = env;
  setTimeout(() => {
    emitter.emit("SIGINT");
  }, 0);
  assertEqual(
    await mainAsync(
      emitter,
      extendConfiguration(
        configuration,
        {
          recorder: "process",
          command: ["/bin/sh", "-c", "sleep 10"],
          "command-win32": ["cmd.exe", "/c", "timeout 10"],
        },
        cwd_url,
      ),
    ),
    1,
  );
}

{
  const emitter = new EventEmitter();
  emitter.env = env;
  assertEqual(
    await mainAsync(
      emitter,
      extendConfiguration(
        configuration,
        {
          recorder: "process",
          command: ["/bin/sh", "-c", "exit 123"],
          "command-win32": ["cmd.exe", "/c", "exit /b 123"],
        },
        cwd_url,
      ),
    ),
    123,
  );
}
