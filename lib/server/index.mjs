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

const makeExecArgv = (options) => {
  if (options['hook-esm']) {
    return [
      '--experimental-loader',
      Path.join(
        home,
        'lib',
        'client',
        options['ecma-version'],
        'node',
        options['hook-cjs'] ? 'index-esm-cjs.js' : 'index-esm.js',
      ),
    ];
  }
  if (options['hook-cjs']) {
    return [
      '--require',
      Path.join(
        home,
        'lib',
        'client',
        options['ecma-version'],
        'node',
        'index-cjs.js',
      ),
    ];
  }
  logger.warning(
    'Not instrumenting anything because both hook-cjs and hook-esm options are falsy',
  );
  return [];
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
    'ecma-version': 'es2015',
    'hook-esm': true,
    'hook-cjs': true,
    'hook-child-process': false,
    'rc-file': null,
    ...options,
  };
  if (options['ecma-version'] !== 'es2015') {
    logger.warning(
      'Only "es2015" is currently supported for options.ecma, got: %s',
      options['ecma-version'],
    );
    options['ecma-version'] = 'es2015';
  }
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
