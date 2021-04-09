import ChildProcess from 'child_process';
import Path from 'path';
import home from '../../home.js';
import logger from './logger.mjs';
import Dispatcher from './dispatcher.mjs';
import { getDefaultConfig } from './config.mjs';
import {
  makeHttp1Server,
  makeHttp2Server,
  registerChild,
} from './response/index.mjs';

const mapping = {
  1: makeHttp1Server,
  '1.0': makeHttp1Server,
  1.1: makeHttp1Server,
  2: makeHttp2Server,
  '2.0': makeHttp2Server,
};

export default (env) => {
  const dispatcher = new Dispatcher(getDefaultConfig().extendWithEnv(env));
  env = {
    APPMAP_PORT: '8080',
    APPMAP_HTTP_VERSION: '1.1',
    ...env,
  };
  if (!(env.APPMAP_HTTP_VERSION in mapping)) {
    logger.warning(
      'Unrecognized APPMAP_HTTP_VERSION, defaulting to 1.1 and got: %s',
      env.APPMAP_HTTP_VERSION,
    );
    env.APPMAP_HTTP_VERSION = '1.1';
  }
  const server = mapping[env.APPMAP_HTTP_VERSION](dispatcher);
  server.listen(env.APPMAP_PORT);
  return {
    server,
    fork: (path, argv, options) => {
      options = {
        __proto__: null,
        ...options,
      };
      const ecma = 'es2015';
      if ('ecma' in options) {
        if (options.ecma !== 'es2015') {
          logger.warning(
            'At the moment only options.ecma es2015 is supported, got: %s',
            options.ecma,
          );
        }
      }
      const execArgv = [];
      if (options.esm) {
        execArgv.push('--experimental-loader');
        if (options.cjs) {
          logger.info('Instrumenting both esm and cjs modules on %s', path);
          execArgv.push(
            Path.join(home, 'client', ecma, 'node', 'main-both.js'),
          );
        } else {
          logger.info('Instrumenting only esm modules on %s', path);
          execArgv.push(Path.join(home, 'client', ecma, 'node', 'main-esm.js'));
        }
      } else if (options.cjs) {
        logger.info('Instrumenting only cjs modules on %s', path);
        execArgv.push('--require');
        execArgv.push(Path.join(home, 'client', ecma, 'node', 'main-cjs.js'));
      } else {
        logger.warning(
          'Not instrumenting anything because options.cjs and options.esm are both falsy',
        );
      }
      if ('execArgv' in options) {
        execArgv.push(...options.execArgv);
      }
      const env1 = {
        ...('env' in options ? options.env : process.env),
      };
      const env2 = {
        __proto__: null,
        APPMAP_CHANNEL: 'fork',
        APPMAP_HOST: 'localhost',
        APPMAP_PORT: String(env.APPMAP_PORT),
        APPMAP_HTTP_VERSION: env.APPMAP_HTTP_VERSION,
      };
      Reflect.ownKeys(env1).forEach((key) => {
        // avoid propagating redundant APPMAP environment variable
        if (!key.startsWith('APPMAP_') || env1[key] !== env[key]) {
          env2[key] = env1[key];
        }
      });
      const child = ChildProcess.fork(path, argv, {
        ...options,
        execArgv,
        env: {
          ...(Reflect.getOwnPropertyDescriptor(options, 'env') === undefined
            ? process.env
            : options.env),
          APPMAP_CHANNEL: 'fork',
          APPMAP_HOST: 'localhost',
          APPMAP_PORT: String(env.APPMAP_PORT),
          APPMAP_HTTP_VERSION: env.APPMAP_HTTP_VERSION,
        },
      });
      registerChild(child, dispatcher);
      return child;
    },
  };
};
