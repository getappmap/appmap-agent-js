import Path from 'path';
import ChildProcess from 'child_process';
import { home } from '../home.js';
import logger from './logger.mjs';
import Dispatcher from './dispatcher.mjs';
import { getDefaultConfig } from './config.mjs';
import { makeServer } from './response/index.mjs';
import { validateConfiguration } from './validate.mjs';

export const createServer = (protocol, data, options) => {
  let config = getDefaultConfig();
  if (data !== null) {
    if (typeof data === 'string') {
      config = config.extendWithFile(data);
    } else {
      validateConfiguration(data);
      config = config.extendWithData(data, process.cwd());
    }
  }
  return makeServer(protocol, new Dispatcher(config), options);
};

const mapping = {
  __proto__: null,
  '14.x': 'node14x',
  '15.x': 'node14x',
  '16.x': 'node14x',
};

const makeExecArgv = (options) => {
  const base = Path.join(
    home,
    'lib',
    'client',
    'es2015',
    mapping[options['node-version']],
  );
  // const argv = [`--require`, Path.join(base, `check-version.js`)];
  const argv = [];
  if (options['hook-esm']) {
    argv.push('--experimental-loader');
    if (options['hook-cjs']) {
      argv.push(Path.join(base, 'index-esm-cjs.js'));
    } else {
      argv.push(Path.join(base, 'index-esm.js'));
    }
  } else if (options['hook-cjs']) {
    argv.push('--require');
    argv.push(Path.join(base, 'index-cjs.js'));
  } else {
    logger.warning(
      'Not instrumenting anything because both hook-cjs and hook-esm options are falsy',
    );
  }
  return argv;
};

const makeEnv = (options) => ({
  APPMAP_PROTOCOL: options.protocol,
  APPMAP_HOST: options.host,
  APPMAP_PORT:
    typeof options.port === 'number' ? String(options.port) : options.port,
  APPMAP_HOOK_CHILD_PROCESS: String(options['hook-child-process']),
  ...(options['rc-file'] === null
    ? {}
    : { APPMAP_RC_FILE: options['rc-file'] }),
});

export const compileOptions = (options) => {
  options = {
    host: 'localhost',
    port: 0,
    protocol: 'messaging',
    'node-version': '14.x',
    'hook-esm': true,
    'hook-cjs': true,
    'hook-child-process': false,
    'rc-file': null,
    ...options,
  };
  // if (options['ecma-version'] !== 'es2015') {
  //   logger.warning(
  //     'Only "es2015" is currently supported for options.ecma, got: %s',
  //     options['ecma-version'],
  //   );
  //   options['ecma-version'] = 'es2015';
  // }
  return {
    execArgv: makeExecArgv(options),
    env: makeEnv(options),
  };
};

export const fork = (main, argv, forkOptions, options) => {
  forkOptions = {
    execArgv: [],
    env: process.env,
    ...forkOptions,
  };
  const { env, execArgv } = compileOptions(options);
  return ChildProcess.fork(main, argv, {
    ...forkOptions,
    execArgv: [...execArgv, ...forkOptions.execArgv],
    env: {
      ...forkOptions.env,
      ...env,
    },
  });
};

const makeSpawn = (callback) => (cmd, argv, spawnOptions, options) => {
  spawnOptions = {
    env: process.env,
    ...spawnOptions,
  };
  const { env, execArgv } = compileOptions(options);
  return ChildProcess.spawn(cmd, [...execArgv, ...argv], {
    ...spawnOptions,
    env: {
      ...spawnOptions.env,
      ...env,
    },
  });
};

export const spawn = makeSpawn(ChildProcess.spawn);

export const spawnSync = makeSpawn(ChildProcess.spawnSync);
