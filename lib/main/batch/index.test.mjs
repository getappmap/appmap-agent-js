import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import { buildTestAsync } from "../../../src/build.mjs";
import Batch from "./index.mjs";

const {
  // equal: assertEqual,
  fail: assertFail,
  // deepEqual: assertDeepEqual
} = Assert;

const { cwd } = process;

const testAsync = async () => {
  const dependencies = await buildTestAsync(
    {
      ...import.meta,
      deps: ["configuration"],
    },
    { server: "tcp" },
  );

  const { mainAsync } = Batch(dependencies);
  global.GLOBAL_SPY_SPAWN_ASYNC = global.GLOBAL_SPY_SPAWN_ASYNC = async (
    exec,
    argv,
    options,
  ) => {
    if (exec === "exec-status-0") {
      return { status: 0, signal: null };
    }
    if (exec === "exec-status-1") {
      return { status: 1, signal: null };
    }
    if (exec === "exec-signal-sigkill") {
      return { status: null, signal: "SIGKILL" };
    }
    if (exec === "exec-error") {
      throw new Error("BOUM");
    }
    assertFail();
  };

  // tcp //
  mainAsync({
    cwd,
    argv: [
      "node",
      "main.js",
      "--protocol",
      "tcp",
      "--",
      "exec-status-0",
      "argv0",
    ],
    env: {},
  });

  // inline //
  mainAsync({
    cwd,
    argv: [
      "node",
      "main.js",
      "--protocol",
      "inline",
      "--",
      "exec-status-0",
      "argv0",
    ],
    env: {},
  });

  // empty //
  mainAsync({
    cwd,
    argv: ["node", "main.js", "--protocol", "inline"],
    env: {},
  });

  // kill //
  mainAsync({
    cwd,
    argv: [
      "node",
      "main.js",
      "--protocol",
      "inline",
      "--",
      "exec-signal-sigkill",
      "argv0",
    ],
    env: {},
  });

  // multiple //
  {
    const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}.yml`;
    await writeFile(path, "children: [[exec-status-0], [exec-signal-sigkill]]");
    mainAsync({
      cwd,
      argv: [
        "node",
        "main.js",
        "--protocol",
        "inline",
        "--configuration",
        path,
      ],
      env: {},
    });
  }
};

testAsync();
