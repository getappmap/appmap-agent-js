import * as ChildProcess from 'child_process';
import logger from './logger.mjs';
import { home } from '../../home.js';

const mapping = {
  __proto__: null,
  cjs: null,
  esm: null,
  'output-dir': 'APPMAP_OUTPUT_DIR',
  'app-name': 'APPMAP_APP_NAME',
  'map-name': 'APPMAP_MAP_NAME',
};

export default (argv, stdio) => {
  const env = {
    __proto__: null,
    ...process.env, // PATH required to find node bin
    ...Reflect.ownKeys(argv).reduce(
      (acc, key) => {
        if (key !== '_') {
          if (key in mapping) {
            if (mapping[key] !== null) {
              acc[mapping[key]] = argv[key];
            }
          } else {
            logger.warning('Unknown cli argument: %s', key);
          }
        }
        return acc;
      },
      { __proto__: null },
    ),
  };
  env.APPMAP_CHANNEL = 'inline';
  if (Reflect.getOwnPropertyDescriptor(argv, 'esm') && argv.esm) {
    let name;
    if (Reflect.getOwnPropertyDescriptor(argv, 'cjs') && argv.cjs) {
      logger.info('Hooking both esm and cjs module');
      name = 'main-both.js';
    } else {
      logger.info('Hooking only esm module');
      name = 'main-esm.js';
    }
    return ChildProcess.spawn(
      'node',
      [
        '--experimental-loader',
        `${home}/lib/client/es2015/node/${name}`,
        ...argv._,
      ],
      { env, stdio },
    );
  }
  if (Reflect.getOwnPropertyDescriptor(argv, 'cjs') && argv.cjs) {
    logger.info('Hooking only cjs module');
    return ChildProcess.spawn(
      'node',
      ['--require', `${home}/lib/client/es2015/node/main-cjs.js`, ...argv._],
      { env, stdio },
    );
  }
  logger.warning('Not hooking anything (expected either --cjs or --esm)');
  return ChildProcess.spawn('node', argv._, { stdio });
};
