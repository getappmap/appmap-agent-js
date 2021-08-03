import {createRequire} from "module"
import {sync as globSync} from 'glob';

// const {sync:globSync} = Glob;


const {stringify} = JSON;
const _Map = Map;
const {isArray} = Array;

const cache = new _Map;

const deriveHome = (path) => {
  if (!cache.has(path)) {
    const require = createRequire(path);
    cache.set(path, require.resolve("appmap-agent-js"));
  }
  return cache.get(path);
};

const default_child = {
  recorder: 'process',
  argv: [],
  options: {},
  configuration: {},
};

export default (dependencies) => {
  const {assert:{assert}, util:{toAbsolutePath}} = dependencies;
  return {
    compileChild: ({path, data}, env1, configuration) => {
      const {protocol, repository:{directory}} = configuration;
      const home = deriveHome(directory);
      const loader = `${home}/main/loader.mjs`;
      const hook = `${home}/main/${recorder}-${protocol}.mjs`;
      const default_options = {
        encoding: 'utf8',
        cwd: path,
        env: {},
        stdio: 'inherit',
        timeout: 0,
        killSignal: 'SIGTERM',
      };
      if (typeof child === 'string') {
        child = {
          type: 'spawn',
          exec: '/bin/sh',
          argv: ['-c', child],
        };
      } else if (isArray(child)) {
        child = {
          type: 'spawn',
          exec: child[0],
          argv: child.slice(1),
        };
      }
      const {type} = child;
      if (type === 'spawn') {
        const {recorder, configuration:config, exec, argv, options:options1} = {
          exec: null,
          ... default_child,
          ...child,
        };
        const options2 = {
          default_options,
          ... options1,
        };
        const {env:env2} = options2;
        const env3 = {...env1, ...env2};
        let node_options = coalesce(env3, "NODE_OPTIONS", "");
        // let {NODE_OPTIONS:node_options} = {NODE_OPTIONS:"", ...env};
        node_options = `${node_options} --experimental-loader=${loader}`;
        if (recorder === "mocha") {
          if (exec === "mocha") {
            argv = [...hook, "--require", hook, ...argv];
          } else {
            assert(exec === "npx", "mocha recorder expected either 'npx' or 'mocha' as executable, got: %j", exec);
            assert(argv[0] === "mocha", "mocha recorder expected 'mocha' to be the first argument passed to npx, got: %j", argv);
            argv = ["mocha", "--require", hook, ...argv.slice(1)];
          }
        } else {
          node_options = `${node_options} --experimental-loader=${hook}`
        }
        return {
          exec: exec,
          argv,
          options: {
            ... options2,
            env: {
              ... env3,
              NODE_OPTIONS: node_options,
              APPMAP_CONFIGURATION: stringify(extendConfiguration(configuration, config, cwd)),
            },
          }
        };
      }
      if (type === 'fork') {
        const {recorder, configuration:config, globbing, main, argv, options:options1} = {
          globbing: false,
          main: null,
          ... default_child,
          ...child,
        };
        const {execPath:exec_path, execArgv:exec_argv, env, ... options2} = {
          execPath: 'node',
          execArgv: [],
          ... default_options,
          ...options1,
        };
        return (
          globbing
            ? globSync(main, { cwd, nodir: true })
            : [toAbsolutePath(cwd, main)]
        ).map((main) => ({
          exec: exec_path,
          argv: [
            ...exec_argv,
            "--experimental-loader",
            loader,
            "--experimental-loader",
            hook,
            main,
            ...argv
          ],
          options: {
            ... options2,
            env: {
              ... env,
              APPMAP_CONFIGURATION: stringify(extendConfiguration(configuration, config, cwd))
            },
          },
        }));
      }
      /* c8 ignore start */
      assert(false, 'invalid child type %o', type);
      /* c8 ignore stop */
    },
  };
};
