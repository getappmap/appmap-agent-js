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

export default (dependencies) => {
  const {assert:{assert}, util:{toAbsolutePath}} = dependencies;
  const getMainPath = (home, name, protocol) => `${home}/${name}-${protocol}.mjs`;
  return {
    compileChild: (child, {cwd, protocol, port}) => {
      const home = deriveHome(cwd);
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
        let {recorder, configuration, argv, options, exec} = {
          recorder: 'normal',
          configuration: {},
          argv: [],
          options: {},
          exec: null,
          ...child,
        };
        if (!isArray(exec)) {
          exec = [exec];
        }
        configuration = {
          path: cwd,
          data: {
            ... configuration,
            port,
            protocol
          }
        };
        options = {
          encoding: 'utf8',
          cwd: '.',
          env: {},
          stdio: 'pipe',
          timeout: 0,
          killSignal: 'SIGTERM',
          ... options,
        };
        const {env} = options;
        const {NODE_OPTIONS:node_options} = {NODE_OPTIONS:"", ...env};
        return {
          exec: exec[0],
          argv: [
            ...exec.slice(1),
            (recorder === "mocha" ? ["--require", getMainPath(home, recorder, protocol)] : []),
            ... argv
          ],
          options: {
            ... options,
            env: {
              ... env,
              NODE_OPTIONS: `${node_options} --experimental-loader=${getMainPath(home, recorder, protocol)}`,
              APPMAP_CONFIGURATION: stringify({
                path: cwd,
                data: {
                  port,
                  protocol,
                  ... configuration,
                }
              }),
            },
          }
        };
      }
      if (type === 'fork') {
        const {recorder, configuration, globbing, main, argv, options:options1} = {
          recorder: 'normal',
          configuration: {},
          globbing: false,
          main: null,
          argv: [],
          options: {},
          ...child,
        };
        const {execPath:exec_path, execArgv:exec_argv, env, ... options2} = {
          execPath: 'node',
          execArgv: [],
          encoding: 'utf8',
          cwd: '.',
          env: {},
          stdio: 'pipe',
          timeout: 0,
          killSignal: 'SIGTERM',
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
            getMainPath(home, recorder, protocol),
            main,
            ...argv
          ],
          options: {
            ... options2,
            env: {
              ... env,
              APPMAP_CONFIGURATION: stringify({
                path: cwd,
                data: configuration,
              }),
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
