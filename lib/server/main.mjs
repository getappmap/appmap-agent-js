import { fork } from 'child_process';
import { makeServer as createHttp1Server } from './response/http1.mjs';
import { makeServer as createHttp2Server } from './response/http2.mjs';
import { registerChild } from './response/fork.mjs';
import home from '../../../home.js';

const mapping = {
  1: createHttp1Server,
  '1.0': createHttp1Server,
  1.1: createHttp1Server,
  2: createHttp2Server,
  '2.0': createHttp2Server,
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
      const options = {
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
      for (let key in env1) {
        if (!key.startsWith('APPMAP_') || env1[key] !== env[key]) {
          env2[key] = env1[key];
        }
      }
      const env1 = { __proto__: null };
      if ('env' in options) {
        env = {
          __proto__: null,
          ...options,
        };
      } else {
      }
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
