import Path from 'path';
import home from '../../home.js';
import logger from './logger.mjs';
import Dispatcher from './dispatcher.mjs';
import { getDefaultConfig } from './config.mjs';
import { makeServer } from './response/index.mjs';

export const createServer = (protocol, env, options) =>
  makeServer(
    protocol,
    new Dispatcher(getDefaultConfig().extendWithEnv(env)),
    options,
  );

const makeHook = (options) => {
  if (options.esm) {
    if (options.cjs) {
      return [
        '--experimental-loader',
        Path.join(home, 'client', options.ecma, 'node', `index-esm-cjs.js`),
      ];
    }
    return [
      '--experimental-loader',
      Path.join(home, 'client', options.ecma, 'node', `index-esm.js`),
    ];
  }
  if (options.cjs) {
    return [
      '--require',
      Path.join(home, 'client', options.ecma, 'node', 'index-cjs.js'),
    ];
  }
  logger.warning(
    'Not instrumenting anything because options.cjs and options.esm are both falsy',
  );
  return [];
};

export const hookSpawnOptions = (spawnOptions, options) => {
  spawnOptions = {
    __proto__: null,
    execArgv: [],
    env: process.env,
    ...spawnOptions,
  };
  options = {
    __proto__: null,
    esm: true,
    cjs: true,
    port: 0,
    protocol: 'messaging',
    ecma: 'es2015',
    ...options,
  };
  if (options.ecma !== 'es2015') {
    logger.warning(
      'Only "es2015" is currently supported for options2.ecma, got: %s',
      options.ecma,
    );
    options.ecma = 'es2015';
  }
  return {
    __proto__: null,
    ...spawnOptions,
    execArgv: [...makeHook(options), ...options.execArgv],
    env: {
      __proto__: null,
      ...spawnOptions.env,
      APPMAP_PROTOCOL: options.protocol,
      APPMAP_HOST: 'localhost',
      APPMAP_PORT:
        typeof options.port === 'number' ? String(options.port) : options.port,
    },
  };
};
