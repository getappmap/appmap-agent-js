import Glob from "glob";

const { sync: globSync } = Glob;
const { stringify } = JSON;
const { isArray } = Array;

const escape = (arg) =>
  /^[a-zA-Z0-9_-]+$/u.test(arg) ? arg : `'${arg.replace(/'/gu, "\\'")}'`;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { toAbsolutePath },
    configuration: { extendConfiguration },
  } = dependencies;
  return {
    compileChild: (child, path, env1, configuration1) => {
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
        options: options1,
        configuration: configuration_data,
        ...child_rest
      } = {
        type: null,
        options: {},
        configuration: {},
        ...child,
      };
      const configuration2 = extendConfiguration(
        configuration1,
        configuration_data,
        path,
      );
      const {
        protocol,
        agent: { directory },
      } = configuration2;
      const { recorder } = configuration2;
      const hook = `${directory}/bin/${recorder}-${protocol}.mjs`;
      const { env: env2, ...options2 } = {
        encoding: "utf8",
        cwd: path,
        env: {},
        stdio: "inherit",
        timeout: 0,
        killSignal: "SIGTERM",
        ...options1,
      };
      const env3 = {
        ...env1,
        ...env2,
        APPMAP_CONFIGURATION: stringify(configuration2),
      };
      if (type === "spawn") {
        let { exec, argv } = {
          exec: null,
          argv: [],
          ...child_rest,
        };
        let { NODE_OPTIONS: node_options } = { NODE_OPTIONS: "", ...env3 };
        if (recorder === "mocha") {
          if (exec === "mocha") {
            argv = ["--require", hook, ...argv];
          } else {
            assert(
              exec === "npx",
              "mocha recorder expected either 'npx' or 'mocha' as executable, got: %j",
              exec,
            );
            assert(
              argv[0] === "mocha",
              "mocha recorder expected 'mocha' to be the first argument passed to npx, got: %j",
              argv,
            );
            argv = ["mocha", "--require", hook, ...argv.slice(1)];
          }
        } else {
          node_options = `${node_options} --experimental-loader=${hook}`;
        }
        return [
          {
            description: `${exec} ${argv.map(escape).join(" ")}`,
            exec: exec,
            argv,
            options: {
              ...options2,
              env: {
                ...env3,
                NODE_OPTIONS: node_options,
              },
            },
          },
        ];
      }
      if (type === "fork") {
        const { globbing, main, argv } = {
          globbing: false,
          main: null,
          argv: [],
          ...child_rest,
        };
        const { execPath: exec_path, execArgv: exec_argv } = {
          execPath: "node",
          execArgv: [],
          ...options2,
        };
        const { cwd } = options2;
        return (
          globbing
            ? globSync(main, { cwd, nodir: true })
            : [toAbsolutePath(cwd, main)]
        ).map((main) => ({
          description: `${main} ${argv.map(escape).join(" ")}`,
          exec: exec_path,
          argv: [...exec_argv, "--experimental-loader", hook, main, ...argv],
          options: {
            ...options2,
            env: env3,
          },
        }));
      }
      /* c8 ignore start */
      assert(false, "invalid child type: %j", child);
      /* c8 ignore stop */
    },
  };
};
