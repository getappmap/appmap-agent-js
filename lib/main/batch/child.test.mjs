import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { mkdir, writeFile } from "fs/promises";
import { buildTestAsync } from "../../../src/build.mjs";
import Child from "./child.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(
    {
      ...import.meta,
      deps: ["configuration"],
    },
    { server: "tcp" },
  );
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { compileChild } = Child(dependencies);
  const configuration = extendConfiguration(
    createConfiguration("/repository"),
    { protocol: "inline" },
    "/",
  );
  const prefix = "/repository/node_modules/@appland/appmap-agent-js/main";
  // spawn //
  {
    const [
      {
        options: {
          env: { APPMAP_CONFIGURATION: configuration_string, ...env },
          ...options
        },
        ...child
      },
    ] = compileChild(
      {
        type: "spawn",
        exec: "exec",
        argv: ["argv0"],
        configuration: {
          packages: [
            {
              regexp: "^",
            },
          ],
        },
        options: {
          cwd: "/directory2",
          env: { key1: "value1", NODE_OPTIONS: "node-options" },
        },
      },
      "/directory1",
      { key2: "value2" },
      configuration,
    );
    const { packages } = JSON.parse(configuration_string);
    assertDeepEqual(packages, [
      [
        {
          basedir: "/directory1",
          flags: "",
          source: "^",
        },
        {
          enabled: true,
          exclude: [],
          shallow: false,
          source: null,
        },
      ],
    ]);
    assertDeepEqual(
      { options: { env, ...options }, ...child },
      {
        options: {
          env: {
            key2: "value2",
            key1: "value1",
            NODE_OPTIONS: `node-options --experimental-loader=${prefix}/process-inline.mjs`,
          },
          encoding: "utf8",
          cwd: "/directory2",
          stdio: "inherit",
          timeout: 0,
          killSignal: "SIGTERM",
        },
        description: "exec argv0",
        exec: "exec",
        argv: ["argv0"],
      },
    );
  }
  // spawn command //
  {
    const [{ exec, argv }] = compileChild("command", "/cwd", {}, configuration);
    assertDeepEqual(
      { exec, argv },
      { exec: "/bin/sh", argv: ["-c", "command"] },
    );
  }
  // spawn parsed command //
  {
    const [{ exec, argv }] = compileChild(
      ["exec", "argv0"],
      "/",
      {},
      configuration,
    );
    assertDeepEqual({ exec, argv }, { exec: "exec", argv: ["argv0"] });
  }
  // spawn mocha //
  {
    const [{ exec, argv }] = compileChild(
      {
        type: "spawn",
        configuration: { recorder: "mocha" },
        exec: "mocha",
        argv: ["argv0"],
      },
      "/",
      {},
      configuration,
    );
    assertDeepEqual(
      { exec, argv },
      {
        exec: "mocha",
        argv: ["--require", `${prefix}/mocha-inline.mjs`, "argv0"],
      },
    );
  }
  // spawn npx mocha //
  {
    const [{ exec, argv }] = compileChild(
      {
        type: "spawn",
        configuration: { recorder: "mocha" },
        exec: "npx",
        argv: ["mocha", "argv0"],
      },
      "/",
      {},
      configuration,
    );
    assertDeepEqual(
      { exec, argv },
      {
        exec: "npx",
        argv: ["mocha", "--require", `${prefix}/mocha-inline.mjs`, "argv0"],
      },
    );
  }
  // fork //
  {
    const [{ exec, argv }] = compileChild(
      {
        type: "fork",
        globbing: false,
        main: "main",
        argv: ["argv0"],
        options: { execPath: "exec-path", execArgv: ["exec-argv-0"] },
      },
      "/",
      {},
      configuration,
    );
    assertDeepEqual(
      { exec, argv },
      {
        exec: "exec-path",
        argv: [
          "exec-argv-0",
          "--experimental-loader",
          `${prefix}/process-inline.mjs`,
          "/main",
          "argv0",
        ],
      },
    );
  }
  // fork glob //
  {
    const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
    await mkdir(directory);
    await writeFile(`${directory}/foo.js`, "123;");
    await writeFile(`${directory}/bar.js`, "123;");
    assertDeepEqual(
      new Set(
        compileChild(
          {
            type: "fork",
            globbing: true,
            main: "*.js",
          },
          directory,
          {},
          configuration,
        ).map(({ argv: { 2: argv2 } }) => argv2),
      ),
      new Set(["foo.js", "bar.js"]),
    );
  }
  // description spawn //
  {
    const [{ description }] = compileChild(
      ["exec", "arg0", "arg 1"],
      "/",
      {},
      configuration,
    );
    assertEqual(description, "exec arg0 'arg 1'");
  }
  // description fork //
  {
    const [{ description }] = compileChild(
      { type: "fork", main: "main", argv: ["arg0", "arg 1"] },
      "/cwd",
      {},
      configuration,
    );
    assertEqual(description, "/cwd/main arg0 'arg 1'");
  }
};

testAsync();
