import { exit, cwd, env } from "node:process";
import { EventEmitter } from "node:events";
import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { assertEqual, assertReject } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { getTmpUrl, convertPathToFileUrl } from "../../path/index.mjs";
import { mainAsync } from "./index.mjs";

const {
  URL,
  setTimeout,
  JSON: { parse: parseJSON },
} = globalThis;

const cwd_url = convertPathToFileUrl(cwd());

const configuration = extendConfiguration(
  createConfiguration(cwd_url),
  {
    "command-options": { shell: false },
    "proxy-port": null,
  },
  cwd_url,
);

// endless mode && no mitm //
{
  const emitter = new EventEmitter();
  emitter.env = env;
  setTimeout(() => {
    emitter.emit("SIGINT");
  }, 0);
  assertEqual(await mainAsync(emitter, configuration), 0);
}

// multiple child >> SIGINT && mitm //
{
  const emitter = new EventEmitter();
  const base = getTmpUrl();
  const output_directory = getUuid();
  const exit_script_filename = `${getUuid()}.js`;
  await writeFileAsync(
    new URL(exit_script_filename, base),
    // We synchronously exit the process because windows
    // does not send messages synchronously and the trace
    // is never reaches the server.
    "setTimeout(() => { process.exit(123); }, 3000);",
    "utf8",
  );
  const timeout_script_filename = `${getUuid()}.js`;
  await writeFileAsync(
    new URL(timeout_script_filename, base),
    "setTimeout(() => {}, 12000);",
    "utf8",
  );
  setTimeout(() => {
    emitter.emit("SIGINT");
  }, 6000);
  emitter.env = env;
  assertEqual(
    await mainAsync(
      emitter,
      extendConfiguration(
        configuration,
        {
          "proxy-port": 0,
          hooks: {
            cjs: false,
            esm: false,
            eval: false,
            apply: false,
            http: false,
            pg: false,
            mysql: false,
            sqlite3: false,
          },
          recorder: "process",
          appmap_dir: output_directory,
          appmap_file: "basename",
          scenario: "^",
          scenarios: {
            key1: {
              command: ["node", exit_script_filename],
              "command-options": {
                cwd: ".",
              },
            },
            key2: {
              command: ["node", timeout_script_filename],
              "command-options": {
                cwd: ".",
              },
            },
          },
        },
        base,
      ),
    ),
    0,
  );
  const assertOutputAsync = async (basename) => {
    assertEqual(
      typeof parseJSON(
        await readFileAsync(
          new URL(`${output_directory}/process/${basename}.appmap.json`, base),
          "utf8",
        ),
      ),
      "object",
    );
  };
  await assertOutputAsync("basename");
  await assertOutputAsync("basename-1");
}

// single child >> success
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
          command: ["/bin/sh", "-c", "exit 0"],
          "command-win32": ["cmd.exe", "/c", "exit /b 0"],
        },
        cwd_url,
      ),
    ),
    0,
  );
}

// single child >> failure
{
  const emitter = new EventEmitter();
  emitter.env = env;
  await assertReject(
    mainAsync(
      emitter,
      extendConfiguration(
        configuration,
        {
          recorder: "process",
          command: ["MISSING-EXECUTABLE"],
        },
        cwd_url,
      ),
    ),
    /^ExternalAppmapError: Failed to spawn child process$/u,
  );
  // receptor is still running because we caught the error
  exit(0);
}
