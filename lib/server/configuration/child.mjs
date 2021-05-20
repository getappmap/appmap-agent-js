import * as ChildProcess from 'child_process';
import * as Path from 'path';
import * as Glob from 'glob';
import { assert } from '../assert.mjs';
import { home } from '../../home.js';
import { Left, Right } from '../either.mjs';
import { resolvePath } from './cwd.mjs';

let spawn = ChildProcess.spawn;

export const setSpawnForTesting = (closure) => (spawn = closure);

///////////////
// Normalize //
///////////////

const mapping = {
  __proto__: null,
  '14.x': 'node14x',
  '15.x': 'node14x',
  '16.x': 'node14x',
};

const getLoaderPath = (version) =>
  Path.join(home, 'lib', 'client', mapping[version], 'hook', 'esm.js');

const getRecorderPath = (version, name) =>
  Path.join(
    home,
    'lib',
    'client',
    mapping[version],
    'recorder',
    `${name}-bin.js`,
  );

export const normalizeChild = (child) => {
  if (typeof child === 'string') {
    child = {
      type: 'spawn',
      exec: '/bin/sh',
      argv: ['-c', child],
    };
  } else if (Array.isArray(child)) {
    child = {
      type: 'spawn',
      exec: child[0],
      argv: child.slice(1),
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
      recorder: 'normal',
      configuration: {},
      exec: undefined,
      argv: [],
      options: {},
      ...child,
    };
    if (!Array.isArray(child.exec)) {
      child.exec = [child.exec];
    }
    child.options = {
      encoding: 'utf8',
      cwd: '.',
      env: {},
      stdio: 'pipe',
      timeout: 0,
      killSignal: 'SIGTERM',
      ...child.options,
    };
    child.options.env = {
      NODE_OPTIONS: '',
      ...child.options.env,
    };
    child.options.env.NODE_OPTIONS += ` --experimental-loader=${getLoaderPath(
      child['node-version'],
    )}`;
    if (child.recorder === 'mocha') {
      return [
        {
          type: 'normalized',
          base,
          exec: child.exec[0],
          argv: [
            ...child.exec.slice(1),
            '--require',
            getRecorderPath(child['node-version'], 'mocha'),
            ...child.argv,
          ],
          configuration: child.configuration,
          options: child.options,
        },
      ];
    }
    if (child.recorder === 'normal') {
      child.options.env.NODE_OPTIONS += ` --require=${getRecorderPath(
        child['node-version'],
        'normal',
      )}`;
    }
    return [
      {
        type: 'normalized',
        base,
        exec: child.exec[0],
        argv: [...child.exec.slice(1), ...child.argv],
        configuration: child.configuration,
        options: child.options,
      },
    ];
  }
  if (child.type === 'fork') {
    child = {
      type: undefined,
      recorder: 'normal',
      'node-version': '14.x',
      configuration: {},
      globbing: true,
      main: undefined,
      argv: [],
      options: {},
      ...child,
    };
    child.options = {
      execPath: 'node',
      execArgv: [],
      encoding: 'utf8',
      cwd: '.',
      env: {},
      stdio: 'pipe',
      timeout: 0,
      killSignal: 'SIGTERM',
      ...child.options,
    };
    child.options.env = {
      NODE_OPTIONS: '',
      ...child.options.env,
    };
    const exec = {
      path: child.options.execPath,
      argv: child.options.execArgv,
    };
    delete child.options.execPath;
    delete child.options.execArgv;
    const argv = [
      ...exec.argv,
      '--experimental-loader',
      getLoaderPath(child['node-version']),
    ];
    if (child.recorder === 'normal') {
      argv.push('--require', getRecorderPath(child['node-version'], 'normal'));
    }
    return (child.globbing
      ? Glob.default.sync(child.main, { cwd: base, nodir: true })
      : [resolvePath(child.main)]
    ).map((main) => ({
      type: 'normalized',
      exec: exec.path,
      argv: [...argv, main, ...child.argv],
      base,
      configuration: child.configuration,
      options: child.options,
    }));
  }
  /* c8 ignore start */
  assert(false, 'invalid child type %o', child);
  /* c8 ignore stop */
};

///////////
// Spawn //
///////////

export const spawnNormalizedChild = (child, configuration) => {
  let either;
  if (configuration.getProtocol() === 'inline') {
    either = configuration
      .extendWithData(child.configuration, child.base)
      .mapRight((configuration) => ({
        ...process.env,
        ...child.env,
        APPMAP_PROTOCOL: 'inline',
        APPMAP_CONFIGURATION: JSON.stringify({
          data: configuration.getData(),
          path: '/',
        }),
      }));
  } else {
    either = new Right({
      ...process.env,
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
    });
  }
  const save = process.cwd();
  process.chdir(child.base);
  try {
    return either.mapRight((env) =>
      spawn(child.exec, child.argv, {
        ...child.options,
        env,
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
