import * as ChildProcess from 'child_process';
import * as Path from 'path';
import * as Glob from 'glob';
import { assert } from '../assert.mjs';
import { home } from '../../home.js';
import { Right, toEither } from '../either.mjs';
import { resolvePath } from './cwd.mjs';

let spawn = ChildProcess.spawn;

export const setSpawnForTesting = (closure) => (spawn = closure);

const escape = (arg) =>
  /^[a-zA-Z_0-9/.-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, "\\'")}'`;

const prependSpace = (string) => ` ${string}`;

///////////////
// Normalize //
///////////////

const getLoaderPath = () =>
  Path.join(home, 'lib', 'client', 'node', 'hook', 'esm.js');

const getRecorderPath = (name) =>
  Path.join(home, 'lib', 'client', 'node', 'recorder', `${name}-bin.js`);

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
  if (child.type === 'cooked') {
    return [child];
  }
  const cwd = resolvePath('.');
  if (child.type === 'spawn') {
    child = {
      type: undefined,
      recorder: 'normal',
      configuration: { cwd },
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
    child.options.env.NODE_OPTIONS += ` --no-warnings --experimental-loader=${getLoaderPath()}`;
    if (child.recorder === 'mocha') {
      return [
        {
          type: 'cooked',
          cwd,
          exec: child.exec[0],
          argv: [
            ...child.exec.slice(1),
            '--require',
            getRecorderPath('mocha'),
            ...child.argv,
          ],
          configuration: child.configuration,
          options: child.options,
        },
      ];
    }
    if (child.recorder === 'normal') {
      child.options.env.NODE_OPTIONS += ` --require=${getRecorderPath(
        'normal',
      )}`;
    }
    return [
      {
        type: 'cooked',
        description: `spawn ${child.exec.map(escape).join(' ')}${child.argv
          .map(escape)
          .map(prependSpace)
          .join('')}`,
        cwd,
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
      configuration: { cwd },
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
      '--no-warnings',
      '--experimental-loader',
      getLoaderPath(),
    ];
    if (child.recorder === 'normal') {
      argv.push('--require', getRecorderPath('normal'));
    }
    return (
      child.globbing
        ? Glob.default.sync(child.main, { cwd, nodir: true })
        : [resolvePath(child.main)]
    ).map((main) => ({
      type: 'cooked',
      description: `fork ${escape(main)}${child.argv
        .map(escape)
        .map(prependSpace)
        .join('')}`,
      exec: exec.path,
      argv: [...argv, main, ...child.argv],
      cwd,
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
      .extendWithData({
        cwd: child.cwd,
        ...child.configuration,
      })
      .mapRight((configuration) => ({
        ...process.env,
        ...child.env,
        APPMAP_PROTOCOL: 'inline',
        APPMAP_CONFIGURATION: configuration.serialize(),
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
        cwd: child.cwd,
        ...child.configuration,
      }),
    });
  }
  const save = process.cwd();
  process.chdir(child.cwd);
  either = either.bind((env) =>
    toEither(spawn, child.exec, child.argv, {
      ...child.options,
      env,
    }),
  );
  process.chdir(save);
  either = either.mapRight((sub) => {
    if (sub.stdout !== null) {
      sub.stdout.setEncoding(child.options.encoding);
    }
    if (sub.stderr !== null) {
      sub.stderr.setEncoding(child.options.encoding);
    }
    return sub;
  });
  return either;
};
