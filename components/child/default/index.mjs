import Glob from "glob";

const { sync: globSync } = Glob;
const { stringify } = JSON;
const { isArray } = Array;

const escape = (arg) =>
  /^[a-zA-Z0-9_-]+$/u.test(arg) ? arg : `'${arg.replace(/'/gu, "\\'")}'`;

export default (dependencies) => {
  const {
    util: { assert, hasOwnProperty, coalesce },
    expect: { expect },
    spawn: { spawnAsync },
  } = dependencies;
  return {
    getChildDescription: ({ exec, argv }) =>
      `${exec} ${argv.map(escape).join(" ")}`,
    spawnChildAsync: (
      {
        exec,
        argv,
        options: { env: env1, ...options },
        configuration: { data, directory },
        fork,
      },
      env2,
      configuration1,
      extendConfiguration,
    ) => {
      const configuration2 = {
        ...extendConfiguration(configuration1, data, directory),
        children: [],
      };
      let env3 = {
        ...env2,
        ...env1,
        APPMAP_CONFIGURATION: stringify(configuration2),
      };
      const {
        recorder,
        agent: { directory: agent_directory },
      } = configuration2;
      const hook = `${agent_directory}/bin/${recorder}.mjs`;
      if (fork === null) {
        env3 = {
          ...env3,
          NODE_OPTIONS: `${coalesce(
            env3,
            "NODE_OPTIONS",
            "",
          )} --experimental-loader=${hook}`,
        };
        if (recorder === "mocha") {
          if (exec === "mocha") {
            argv = ["--require", hook, ...argv];
          } else {
            expect(
              exec === "npx",
              "mocha recorder expected either 'npx' or 'mocha' as executable, got: %j",
              exec,
            );
            expect(
              argv[0] === "mocha",
              "mocha recorder expected 'mocha' to be the first argument passed to npx, got: %j",
              argv,
            );
            argv = ["mocha", "--require", hook, ...argv.slice(1)];
          }
        }
      } else {
        const { exec: fork_exec, argv: fork_argv } = fork;
        argv = [...fork_argv, "--experimental-loader", hook, exec, ...argv];
        exec = fork_exec;
      }
      return spawnAsync(exec, argv, { env: env3, ...options });
    },
    createChildren: (child, directory) => {
      if (typeof child === "string") {
        child = {
          type: "spawn",
          exec: "/bin/sh",
          argv: ["-c", child],
        };
      } else if (isArray(child)) {
        child = {
          type: "spawn",
          exec: child[0],
          argv: child.slice(1),
        };
      }
      const {
        type,
        globbing,
        exec,
        argv,
        options: options1,
        configuration: data,
      } = {
        type: null,
        globing: true,
        exec: null,
        argv: [],
        options: {},
        configuration: {},
        ...child,
      };
      expect(
        !hasOwnProperty(data, "children"),
        "child configurations should not provide children, got: %j",
        child,
      );
      const configuration = {
        data,
        directory,
      };
      const {
        execPath: fork_path,
        execArgv: fork_argv,
        ...options2
      } = {
        execPath: "node",
        execArgv: [],
        encoding: "utf8",
        cwd: directory, // NB: defines cwd for exec
        env: {},
        stdio: "inherit",
        timeout: 0,
        killSignal: "SIGTERM",
        ...options1,
      };
      {
        const { env } = options2;
        expect(
          !hasOwnProperty(env, "APPMAP_CONFIGURATION"),
          "child environment should not defined 'APPMAP_CONFIGURATION', got: %j",
          child,
        );
      }
      if (type === "spawn") {
        return [
          {
            fork: null,
            exec,
            argv,
            configuration,
            options: options2,
          },
        ];
      }
      assert(type === "fork", "invalid child type");
      const { cwd } = options2;
      return (globbing ? globSync(exec, { cwd, nodir: true }) : [exec]).map(
        (exec) => ({
          fork: {
            exec: fork_path,
            argv: fork_argv,
          },
          exec,
          argv,
          configuration,
          options: options2,
        }),
      );
    },
  };
};
