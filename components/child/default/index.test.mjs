/* eslint-env node */

import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { mkdir, writeFile } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Child from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const extendConfiguration = (data1, data2, directory) => ({
    directory,
    ...data1,
    ...data2,
  });
  const { createChildren, compileChild, getChildDescription } =
    Child(dependencies);
  const default_options = {
    encoding: "utf8",
    stdio: "inherit",
    timeout: 0,
    killSignal: "SIGTERM",
  };
  // spawn >> process //
  {
    const children = createChildren(
      {
        type: "spawn",
        exec: "exec",
        argv: ["argv0"],
        configuration: { recorder: "process" },
        options: {
          cwd: "/cwd",
          env: { key1: "value1", NODE_OPTIONS: "node-options-1" },
        },
      },
      "/configuration-directory",
    );
    assertEqual(children.length, 1);
    assertDeepEqual(
      compileChild(
        children[0],
        { key2: "value2", NODE_OPTIONS: "node-options-2" },
        {
          agent: {
            directory: "/agent-directory",
          },
        },
        extendConfiguration,
      ),
      {
        exec: "exec",
        argv: ["argv0"],
        options: {
          cwd: "/cwd",
          env: {
            key1: "value1",
            key2: "value2",
            NODE_OPTIONS:
              "node-options-1 --require=/agent-directory/lib/abomination.js --experimental-loader=/agent-directory/lib/process.mjs",
            APPMAP_CONFIGURATION: JSON.stringify({
              directory: "/configuration-directory",
              agent: { directory: "/agent-directory" },
              recorder: "process",
            }),
          },
          ...default_options,
        },
      },
    );
  }
  // spawn >> mocha //
  {
    const testMochaAsync = async (npx) => {
      const [child] = createChildren(
        {
          type: "spawn",
          exec: npx ? "npx" : "mocha",
          argv: npx ? ["mocha", "argv0"] : ["argv0"],
          configuration: { recorder: "mocha" },
        },
        "/configuration-directory",
      );
      const { exec, argv } = compileChild(
        child,
        {},
        {
          agent: {
            directory: "/agent-directory",
          },
        },
        extendConfiguration,
      );
      assertDeepEqual(
        { exec, argv },
        {
          exec: npx ? "npx" : "mocha",
          argv: [
            ...(npx ? ["--always-spawn", "mocha"] : []),
            "--require",
            "/agent-directory/lib/mocha.mjs",
            "argv0",
          ],
        },
      );
    };
    await testMochaAsync(true);
    await testMochaAsync(false);
  }
  // spawn command //
  assertDeepEqual(
    createChildren("command", "/directory"),
    createChildren(
      { type: "spawn", exec: "/bin/sh", argv: ["-c", "command"] },
      "/directory",
    ),
  );
  // spawn parsed command //
  assertDeepEqual(
    createChildren(["command", "argv0"], "/directory"),
    createChildren(
      { type: "spawn", exec: "command", argv: ["argv0"] },
      "/directory",
    ),
  );
  // fork >> without globbing //
  {
    const children = createChildren(
      {
        type: "fork",
        globbing: false,
        exec: "exec",
        argv: ["argv0"],
        options: { execPath: "exec-path", execArgv: ["exec-argv-0"] },
      },
      "/configuration-directory",
    );
    assertEqual(children.length, 1);
    const [child] = children;
    assertDeepEqual(
      compileChild(
        child,
        {},
        {
          agent: {
            directory: "/agent-directory",
          },
          recorder: "process",
        },
        extendConfiguration,
      ),
      {
        exec: "exec-path",
        argv: [
          "exec-argv-0",
          "--experimental-loader",
          "/agent-directory/lib/process.mjs",
          "exec",
          "argv0",
        ],
        options: {
          cwd: "/configuration-directory",
          env: {
            APPMAP_CONFIGURATION: JSON.stringify({
              directory: "/configuration-directory",
              agent: { directory: "/agent-directory" },
              recorder: "process",
            }),
          },
          ...default_options,
        },
      },
    );
  }
  // fork >> with globbing //
  {
    const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
    await mkdir(directory);
    await writeFile(`${directory}/foo.js`, "123;");
    await writeFile(`${directory}/bar.js`, "123;");
    assertDeepEqual(
      new Set(
        createChildren(
          {
            type: "fork",
            globbing: true,
            exec: "*.js",
          },
          directory,
        ).map(({ exec }) => exec),
      ),
      new Set(["foo.js", "bar.js"]),
    );
  }
  // description //
  assertDeepEqual(
    createChildren(["exec", "argv0", "argv 1"]).map(getChildDescription),
    ["exec argv0 'argv 1'"],
  );
};

testAsync();
