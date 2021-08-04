import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { mkdir, writeFile } from "fs/promises";
import { buildTestAsync } from "../../../build/index.mjs";
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
  // spawn //
  {
    const [
      {
        options: {
          env: { APPMAP_CONFIGURATION: configuration, ...env },
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
          cwd: "/cwd2",
          env: { key1: "value1", NODE_OPTIONS: "node-options" },
        },
      },
      "/cwd1",
      { key2: "value2" },
      extendConfiguration(createConfiguration("/"), {}, "/foo"),
    );
    const { packages } = JSON.parse(configuration);
    assertDeepEqual(packages, [
      [
        {
          basedir: "/cwd1",
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
            NODE_OPTIONS:
              "node-options --experimental-loader=null/main/loader.mjs --experimental-loader=null/main/process-tcp.mjs",
          },
          encoding: "utf8",
          cwd: "/cwd2",
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
    const [{ exec, argv }] = compileChild(
      "command",
      "/cwd",
      {},
      createConfiguration("/"),
    );
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
      createConfiguration("/"),
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
      createConfiguration("/"),
    );
    assertDeepEqual(
      { exec, argv },
      {
        exec: "mocha",
        argv: ["--require", "null/main/mocha-tcp.mjs", "argv0"],
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
      createConfiguration("/"),
    );
    assertDeepEqual(
      { exec, argv },
      {
        exec: "npx",
        argv: ["mocha", "--require", "null/main/mocha-tcp.mjs", "argv0"],
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
      createConfiguration("/"),
    );
    assertDeepEqual(
      { exec, argv },
      {
        exec: "exec-path",
        argv: [
          "exec-argv-0",
          "--experimental-loader",
          "null/main/loader.mjs",
          "--experimental-loader",
          "null/main/process-tcp.mjs",
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
          createConfiguration("/"),
        ).map(({ argv: { 4: argv4 } }) => argv4),
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
      createConfiguration("/"),
    );
    assertEqual(description, "exec arg0 'arg 1'");
  }
  // description fork //
  {
    const [{ description }] = compileChild(
      { type: "fork", main: "main", argv: ["arg0", "arg 1"] },
      "/cwd",
      {},
      createConfiguration("/"),
    );
    assertEqual(description, "/cwd/main arg0 'arg 1'");
  }
};

testAsync();
