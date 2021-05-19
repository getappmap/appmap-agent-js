import * as ChildProcess from 'child_process';
import * as Path from 'path';
import * as Glob from 'glob';
import { assert } from '../assert.mjs';
import { home } from '../../home.js';
import { Left, Right } from '../either.mjs';
import { resolvePath } from './cwd.mjs';

const mapping = {
  __proto__: null,
  '14.x': 'node14x',
  '15.x': 'node14x',
  '16.x': 'node14x',
};

let spawn = ChildProcess.spawn;

export const setSpawnForTesting = (closure) => (spawn = closure);

export const spawnNormalizedChild = (child, configuration) => {
  let env = process.env;
  const hook = `${
    Reflect.getOwnPropertyDescriptor(env, 'NODE_OPTIONS') === undefined
      ? ''
      : `${env.NODE_OPTIONS} `
  } --experimental-loader' ${Path.join(
    home,
    'lib',
    'client',
    'es2015',
    'node14x',
    'hook',
    'esm.js',
  )} --require ${Path.join(
    home,
    'lib',
    'client',
    'es2015',
    mapping[child['node-version']],
    'recorder',
    `${child['recorder-name']}.js`,
  )}`;
  let either;
  if (configuration.getProtocol() === 'inline') {
    either = configuration
      .extendWithData(child.configuration, child.base)
      .mapRight(({ data }) => ({
        ...env,
        ...child.env,
        APPMAP_PROTOCOL: 'inline',
        APPMAP_CONFIGURATION: JSON.stringify({
          data,
          path: '/',
        }),
        NODE_OPTIONS: hook,
      }));
  } else {
    either = new Right({
      ...env,
      ...child.env,
      APPMAP_PROTOCOL: configuration.getProtocol(),
      APPMAP_HOST: configuration.getHost(),
      APPMAP_PORT:
        typeof configuration.getPort() === 'number'
          ? String(configuration.getPort())
          : configuration.getPort(),
      APPMAP_CONFIGURATION: JSON.stringify({
        data: child.configuration,
        path: child.base,
      }),
      NODE_OPTIONS: hook,
    });
  }
  const save = process.cwd();
  process.chdir(child.base);
  try {
    return either.mapRight((env) =>
      spawn(child.exec, child.argv, {
        cwd: child.cwd,
        env,
        stdio: child.stdio,
        encoding: 'utf8',
        timeout: child.timeout,
        killSignal: child['kill-signal'],
      }),
    );
  } catch (error) {
    return new Left(error.message);
    // NB: No idea why we need to ignore the finally below; maybe a c8 bug?
    /* c8 ignore start */
  } finally {
    /* c8 ignore stop */
    process.chdir(save);
  }
};

export const normalizeChild = (child) => {
  if (typeof child === 'string') {
    child = child.split(' ');
  }
  if (Array.isArray(child)) {
    child = {
      type: 'spawn',
      exec: child[0],
      argv: child.slice(1, child.length),
    };
  }
  if (child.type === 'normalized') {
    return [child];
  }
  const base = resolvePath('.');
  if (child.type === 'spawn') {
    child = {
      type: undefined,
      'node-version': '14.x',
      'recorder-name': 'normal',
      configuration: {},
      exec: undefined,
      argv: [],
      cwd: '.',
      env: {},
      stdio: 'pipe',
      timeout: 0,
      'kill-signal': 'SIGTERM',
      ...child,
    };
    return [
      {
        ...child,
        type: 'normalized',
        base,
      },
    ];
  }
  if (child.type === 'fork') {
    child = {
      type: undefined,
      'recorder-name': 'normal',
      'node-version': '14.x',
      configuration: {},
      'exec-path': 'node',
      'exec-argv': [],
      globbing: true,
      main: undefined,
      argv: [],
      cwd: '.',
      env: {},
      stdio: 'pipe',
      timeout: 0,
      'kill-signal': 'SIGTERM',
      ...child,
    };
    const exec = {
      path: child['exec-path'],
      argv: child['exec-argv'],
    };
    delete child['exec-path'];
    delete child['exec-argv'];
    const mains = child.globbing
      ? Glob.default.sync(child.main, { cwd: base, nodir: true })
      : [resolvePath(child.main)];
    delete child.main;
    delete child.globbing;
    return mains.map((main) => ({
      ...child,
      type: 'normalized',
      base,
      exec: exec.path,
      argv: [...exec.argv, main, ...child.argv],
    }));
  }
  /* c8 ignore start */
  assert(false, 'invalid child type %o', child);
  /* c8 ignore stop */
};
