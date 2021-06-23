'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Util = require('util');
var FileSystem = require('fs');
var Path = require('path');
var YAML = require('yaml');
var Ajv = require('ajv');
var Treeify = require('treeify');
var AjvErrorTree = require('ajv-error-tree');
var Minimatch = require('minimatch');
var ChildProcess = require('child_process');
var Glob = require('glob');
var OperatingSystem = require('os');
var escodegen = require('escodegen');
var acorn = require('acorn');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

var Util__namespace = /*#__PURE__*/_interopNamespace(Util);
var FileSystem__namespace = /*#__PURE__*/_interopNamespace(FileSystem);
var Path__default = /*#__PURE__*/_interopDefaultLegacy(Path);
var Path__namespace = /*#__PURE__*/_interopNamespace(Path);
var YAML__default = /*#__PURE__*/_interopDefaultLegacy(YAML);
var Ajv__default = /*#__PURE__*/_interopDefaultLegacy(Ajv);
var Treeify__default = /*#__PURE__*/_interopDefaultLegacy(Treeify);
var AjvErrorTree__default = /*#__PURE__*/_interopDefaultLegacy(AjvErrorTree);
var Minimatch__namespace = /*#__PURE__*/_interopNamespace(Minimatch);
var ChildProcess__namespace = /*#__PURE__*/_interopNamespace(ChildProcess);
var Glob__namespace = /*#__PURE__*/_interopNamespace(Glob);
var OperatingSystem__namespace = /*#__PURE__*/_interopNamespace(OperatingSystem);

// I'm not sure about the debuglog api because modifying process.env.NODE_DEBUG has no effect.
// Why not directly provide the optimize logging function then?
// https://github.com/nodejs/node/blob/master/lib/internal/util/debuglog.js

const logger = {
  error: Util__namespace.debuglog('appmap-error', (log) => {
    logger.error = log;
  }),
  warning: Util__namespace.debuglog('appmap-warning', (log) => {
    logger.warning = log;
  }),
  info: Util__namespace.debuglog('appmap-info', (log) => {
    logger.info = log;
  }),
  debug: Util__namespace.debuglog('appmap-debug', (log) => {
    logger.debug = log;
  }),
};

// This file must be placed at lib/home.js because it also bundled into dist/inline.js and __dirname is not modified.



var home_1 = Path__default['default'].resolve(__dirname, "..");

const assert = (boolean, format, ...values) => {
  if (!boolean) {
    throw new Error(Util__namespace.format(format, ...values));
  }
};

//                 | InternalError | ExternalError  | InnerExternalError   | OuterExternalError |
// ==============================================================================================
// Location of the | Inside the    | Out of the     | Out of the module or | Out of the package |
// root cause of   | module or its | module or its  | its deps. but still  |                    |
// the error       | deps.         | deps           | inside the package   |                    |
// ==============================================================================================
// Did the module  | No            | Yes            | Yes                  | Yes                |
// and its deps.   |               |                |                      |                    |
// behaved as      |               |                |                      |                    |
// expected?       |               |                |                      |                    |
// ==============================================================================================
// Did the package | No            | Maybe          | No                   | Yes                |
// behaved as      |               |                |                      |                    |
// expected?       |               |                |                      |                    |
// ==============================================================================================
// Is a bug?       | Yes           | Maybe          | Yes                  | No                 |
// ==============================================================================================
//
// ** Any other kind of error must be considered as an internal error. **
//
// NB: The classification above presuposes that types are correct.
// For instance, consider the following function:
//
// const exponent = (base /* integer */, exponent /* integer */) => {
//   if (exponent < 0) {
//     throw new ExternalError("expected a positive integer");
//   }
//   let result = 1;
//   for (let index = 0; index < exponent; index++) {
//     result *= base;
//   }
//   if (result !== base ** exponent) {
//     throw new InternalError("unexpected result");
//   }
//   return result;
// };
//
// Its implementation is correct and as long as it is given integers,
// it will never throw any other exceptions than ExternalError.
// However if we pass floats it will throw a ModuleInternalError.
// And if we pass symbols it will throw a TypeError.
//
// export class InternalError extends Error;
//
// export class ExternalError extends Error;
//
// export class InnerExternalError extends ExternalError;
//
// export class OuterExternalError extends ExternalError;

class Either {
  constructor(data) {
    this.data = data;
  }
}

class Left extends Either {
  isLeft() {
    return true;
  }
  isRight() {
    return false;
  }
  fromLeft() {
    return this.data;
  }
  fromRight() {
    assert(
      false,
      'expected a right either, got a left either with: %o',
      this.data,
    );
  }
  either(closure1, closure2) {
    return closure1(this.data);
  }
  mapBoth(closure) {
    return new Left(closure(this.data));
  }
  mapLeft(closure) {
    return new Left(closure(this.data));
  }
  mapRight(closure) {
    return this;
  }
  bind(closure) {
    return this;
  }
  bindAsync(closure) {
    return Promise.resolve(this);
  }
  unwrap() {
    throw new Error(this.data);
  }
}

class Right extends Either {
  isLeft() {
    return false;
  }
  isRight() {
    return true;
  }
  fromLeft() {
    assert(
      false,
      'expected a left either, got a right either with: %o',
      this.data,
    );
  }
  fromRight() {
    return this.data;
  }
  either(closure1, closure2) {
    return closure2(this.data);
  }
  mapBoth(closure) {
    return new Right(closure(this.data));
  }
  mapLeft(closure) {
    return this;
  }
  mapRight(closure) {
    return new Right(closure(this.data));
  }
  bind(closure) {
    return closure(this.data);
  }
  bindAsync(closure) {
    return closure(this.data);
  }
  unwrap() {
    return this.data;
  }
}

const forEither = (iterator, closure) => {
  const step = () => {
    const { done, value } = iterator.next();
    if (done) {
      return new Right(null);
    }
    return closure(value).bind(step);
  };
  return step();
};

const forEitherAsync = (iterator, closure) => {
  const step = () => {
    const { done, value } = iterator.next();
    if (done) {
      return Promise.resolve(new Right(null));
    }
    return closure(value).then((either) => either.bind(step));
  };
  return step();
};

const toEither = (callback, ...rest) => {
  try {
    return new Right(callback(...rest));
    // c8 vs node12
    /* c8 ignore start */
  } catch (error) {
    /* c8 ignore stop */
    return new Left(error.message);
  }
};

const ajv = new Ajv__default['default']({ verbose: true });
ajv.addSchema(
  YAML__default['default'].parse(
    FileSystem__namespace.readFileSync(Path__namespace.resolve(home_1, 'src', 'schema.yml'), 'utf8'),
  ),
);
const validateRequestSchema = ajv.getSchema('request');
const validateConfigurationSchema = ajv.getSchema('configuration');

const makeValidate = (name, callback) => (json) => {
  if (!callback(json)) {
    logger.warning(`invalid json for schema %s: %j`, name, callback.errors);
    assert(callback.errors.length > 0, `unexpected empty error array`);
    return new Left(
      Treeify__default['default'].asTree(
        AjvErrorTree__default['default'].summarizeAJVErrorTree(
          AjvErrorTree__default['default'].structureAJVErrorArray(callback.errors),
        ),
        true,
      ),
    );
  }
  return new Right(json);
};

const validateRequest = makeValidate('request', validateRequestSchema);

const validateConfiguration = makeValidate(
  'configuration',
  validateConfigurationSchema,
);

let cwd = process.cwd();

const changeWorkingDirectory = (path, callback) => {
  assert(
    path === null || Path__namespace.isAbsolute(path),
    'expected an absolute path, got: %j',
    path,
  );
  const save = cwd;
  cwd = path;
  try {
    return callback();
    // c8 vs node12
    /* c8 ignore start */
  } finally {
    /* c8 ignore stop */
    cwd = save;
  }
};

const resolvePath = (path) => {
  if (Path__namespace.isAbsolute(path)) {
    return Path__namespace.resolve(path);
  }
  assert(cwd !== null, 'missing cwd to resolve relative path: %j', path);
  return Path__namespace.resolve(cwd, path);
};

const options = {
  nocomment: true,
};

const escape$1 = (char) => `\\${char}`;

const sanitizeForRegExp = (string) =>
  string.replace(/[/\\+*?.^$()[\]{}|]/g, escape$1);

const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape$1);

const cache = new Map();

const lookupNormalizedSpecifierArray = (
  specifiers,
  path,
  placeholder,
) => {
  assert(Path__namespace.isAbsolute(path), 'expected an absolute path, got: %o', path);
  for (let index = 0; index < specifiers.length; index += 1) {
    const { pattern, flags, data } = specifiers[index];
    const key = `${pattern}|${flags}`;
    let regexp = cache.get(key);
    if (regexp === undefined) {
      regexp = new RegExp(pattern, flags);
      cache.set(key, regexp);
    }
    if (regexp.test(path)) {
      return data;
    }
  }
  return placeholder;
};

const normalizeSpecifier = (specifier, data) => {
  if (Reflect.getOwnPropertyDescriptor(specifier, 'data') !== undefined) {
    return specifier;
  }
  specifier = {
    glob: null,
    path: null,
    dist: null,
    pattern: null,
    flags: '',
    recursive: false,
    nested: false,
    external: false,
    ...specifier,
  };
  if (specifier.pattern !== null) {
    return {
      pattern: specifier.pattern,
      flags: specifier.flags,
      data,
    };
  }
  if (specifier.glob !== null) {
    const regexp = new Minimatch__namespace.default.Minimatch(
      Path__namespace.resolve(sanitizeForGlob(resolvePath('.')), specifier.glob),
      options,
    ).makeRe();
    return {
      pattern: regexp.source,
      flags: regexp.flags,
      data,
    };
  }
  if (specifier.path !== null) {
    return {
      pattern: `^${sanitizeForRegExp(resolvePath(specifier.path))}($|/${
        specifier.recursive ? '' : '[^/]*$'
      })`,
      flags: '',
      data,
    };
  }
  if (specifier.dist !== null) {
    let pattern = `/node_modules/${sanitizeForRegExp(specifier.dist)}/`;
    if (!specifier.external) {
      pattern = `^${sanitizeForRegExp(resolvePath('.'))}${pattern}`;
    }
    if (!specifier.recursive) {
      pattern = `${pattern}[^/]*$`;
    }
    return {
      pattern,
      flags: '',
      data,
    };
  }
  /* c8 ignore start */
  assert(false, 'invalid specifier %o', specifier);
  /* c8 ignore stop */
};

let spawn = ChildProcess__namespace.spawn;

const escape = (arg) =>
  /^[a-zA-Z_0-9/.-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, "\\'")}'`;

const prependSpace = (string) => ` ${string}`;

///////////////
// Normalize //
///////////////

const getLoaderPath = () =>
  Path__namespace.join(home_1, 'lib', 'client', 'node', 'hook', 'esm.js');

const getRecorderPath = (name) =>
  Path__namespace.join(home_1, 'lib', 'client', 'node', 'recorder', `${name}-bin.js`);

const normalizeChild = (child) => {
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
      globbing: false,
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
        ? Glob__namespace.default.sync(child.main, { cwd, nodir: true })
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

const spawnNormalizedChild = (child, configuration) => {
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

const trim = (string) => string.trim();

const identity$1 = (any) => any;

const run = (command, path) => {
  const result = ChildProcess__namespace.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    {
      cwd: path,
      encoding: 'utf8',
      timeout: 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  assert(
    Reflect.getOwnPropertyDescriptor(result, 'error') === undefined,
    `unexpected error for command %o and cwd %o >> %o`,
    command,
    path,
    result.error,
  );
  assert(
    result.signal === null,
    `unexpected signal %o for command %o and path %o`,
    result.signal,
    command,
    path,
  );
  if (result.status === 0) {
    return new Right(result.stdout.trim());
  }
  logger.warning(
    `command %o on cwd %o failed with %o >> %o`,
    command,
    path,
    result.status,
    result.stderr,
  );
  return new Left(null);
};

const parseStatus = (stdout) => stdout.split('\n').map(trim);

const parseDescription = (stdout) => {
  const parts = /^([^-]*)-([0-9]+)-/u.exec(stdout);
  assert(parts !== null, `failed to parse git description %o`, stdout);
  return parseInt(parts[2], 10);
};

const getGitInformation = (path) => {
  let names;
  try {
    names = FileSystem__namespace.readdirSync(path);
  } catch (error) {
    logger.warning('failed to read %o >> %s', path, error.message);
    return null;
  }
  if (!names.includes('.git')) {
    logger.warning('not a path to a git directory %o', path);
    return null;
  }
  return {
    repository: run(`git config --get remote.origin.url`, path).fromRight(),
    branch: run(`git rev-parse --abbrev-ref HEAD`, path).fromRight(),
    commit: run(`git rev-parse HEAD`, path).fromRight(),
    status: run(`git status --porcelain`, path)
      .mapRight(parseStatus)
      .fromRight(),
    tag: run(`git describe --abbrev=0 --tags`, path).either(identity$1, identity$1),
    annotated_tag: run(`git describe --abbrev=0`, path).either(
      identity$1,
      identity$1,
    ),
    commits_since_tag: run(`git describe --long --tags`, path).either(
      identity$1,
      parseDescription,
    ),
    commits_since_annotated_tag: run(`git describe --long`, path).either(
      identity$1,
      parseDescription,
    ),
  };
};

const identity = (any) => any;

const cpus = OperatingSystem__namespace.cpus().length;

////////////
// Extend //
////////////

const assign = (fields, name, value) => {
  fields[name] = {
    ...fields[name],
    ...value,
  };
};

const overwrite = (fields, name, value) => {
  fields[name] = value;
};

const prepend = (fields, name, value) => {
  fields[name] = [...value, ...fields[name]];
};

///////////////
// Normalize //
///////////////

const makeNormalizeSplit = (separator, key1, key2) => (value) => {
  if (typeof value === 'string') {
    const [head, ...tail] = value.split(separator);
    return {
      [key1]: head,
      [key2]: tail.length === 0 ? null : tail.join(separator),
    };
  }
  return value;
};

const normalizeRecording = makeNormalizeSplit(
  '.',
  'defined-class',
  'method-id',
);

const normalizeLanguage = makeNormalizeSplit('@', 'name', 'version');

const normalizeEngine = makeNormalizeSplit('@', 'name', 'version');

const normalizeFrameworksHelper = makeNormalizeSplit('@', 'name', 'version');
const normalizeFrameworks = (frameworks) =>
  frameworks.map(normalizeFrameworksHelper);

const normalizeConcurrency = (concurrency) => {
  if (typeof concurrency === 'string') {
    concurrency = parseInt(concurrency.substring(0, concurrency.length - 1));
    concurrency = Math.floor((cpus * concurrency) / 100);
    concurrency = Math.max(1, concurrency);
  }
  return concurrency;
};

const normalizeHooks = (hooks) => {
  hooks = { ...hooks };
  for (let key of Reflect.ownKeys(hooks)) {
    if (hooks[key] === true) {
      hooks[key] = {};
    } else if (hooks[key] === false) {
      hooks[key] = null;
    }
  }
  return hooks;
};

const normalizeMain = (main) => {
  if (typeof main === 'string') {
    main = { path: main };
  }
  return {
    path: main.path === null ? main.path : resolvePath(main.path),
  };
};

const normalizeBase = (base) => {
  if (typeof base === 'string') {
    base = { directory: base };
  }
  const directory = resolvePath(base.directory);
  return {
    directory,
    git: getGitInformation(directory),
  };
};

// const normalizeRecorder = (recorder) => {
//   if (typeof recorder === 'string') {
//     recorder = { name: recorder };
//   }
//   return recorder;
// };

const normalizeOutput = (output) => {
  if (typeof output === 'string') {
    output = { directory: output };
  }
  if (Reflect.getOwnPropertyDescriptor(output, 'directory') === undefined) {
    return output;
  }
  return {
    ...output,
    directory: resolvePath(output.directory),
  };
};

const normalizePackageSpecifier = (specifier) => {
  if (typeof specifier === 'string') {
    specifier = { path: specifier };
  }
  specifier = {
    enabled: true,
    shallow: false,
    exclude: [],
    ...specifier,
  };
  return normalizeSpecifier(specifier, {
    enabled: specifier.enabled,
    shallow: specifier.shallow,
    exclude: specifier.exclude,
  });
};

const normalizePackages = (specifiers) =>
  specifiers.map(normalizePackageSpecifier);

const normalizeChilderen = (children) => children.flatMap(normalizeChild);

const normalizeEnablingSpecifier = (specifier) => {
  if (typeof specifier === 'string') {
    specifier = { path: specifier };
  }
  specifier = {
    enabled: true,
    ...specifier,
  };
  return normalizeSpecifier(specifier, {
    enabled: specifier.enabled,
  });
};

const normalizeEnabled = (specifiers) => {
  if (typeof specifiers === 'boolean') {
    return [
      {
        pattern: '[\\s\\S]*',
        flags: '',
        data: {
          enabled: specifiers,
        },
      },
    ];
  }
  return specifiers.map(normalizeEnablingSpecifier);
};

////////////
// fields //
////////////

const infos = {
  __proto__: null,
  // server //
  protocol: {
    extend: overwrite,
    normalize: identity,
    initial: 'messaging',
  },
  host: {
    extend: overwrite,
    normalize: identity,
    initial: 'localhost',
  },
  port: {
    extend: overwrite,
    normalize: identity,
    initial: 0,
  },
  concurrency: {
    extend: overwrite,
    normalize: normalizeConcurrency,
    initial: 1,
  },
  children: {
    extend: prepend,
    normalize: normalizeChilderen,
    initial: [],
  },
  // client //
  recorder: {
    extend: overwrite,
    normalize: identity,
    initial: 'normal',
  },
  source: {
    extend: overwrite,
    normalize: identity,
    initial: false,
  },
  hooks: {
    extend: assign,
    normalize: normalizeHooks,
    initial: {
      esm: {},
      cjs: {},
      http: null,
      mysql: null,
      sqlite3: null,
      pg: null,
    },
  },
  enabled: {
    extend: prepend,
    normalize: normalizeEnabled,
    initial: [],
  },
  'escape-prefix': {
    extend: overwrite,
    normalize: identity,
    initial: 'APPMAP',
  },
  main: {
    extend: overwrite,
    normalize: normalizeMain,
    initial: { path: null },
  },
  language: {
    extend: overwrite,
    normalize: normalizeLanguage,
    initial: {
      name: 'ecmascript',
      version: '2020',
    },
  },
  engine: {
    extend: overwrite,
    normalize: normalizeEngine,
    initial: {
      name: null,
      version: null,
    },
  },
  packages: {
    extend: prepend,
    normalize: normalizePackages,
    initial: [],
  },
  exclude: {
    extend: prepend,
    normalize: identity,
    initial: [],
  },
  // recording //
  recording: {
    extend: overwrite,
    normalize: normalizeRecording,
    initial: null,
  },
  output: {
    extend: assign,
    normalize: normalizeOutput,
    initial: {
      directory: resolvePath(`tmp/appmap`),
      'file-name': null,
    },
  },
  base: {
    extend: overwrite,
    normalize: normalizeBase,
    initial: {
      directory: resolvePath('.'),
      git: null,
    },
  },
  'event-pruning': {
    extend: overwrite,
    normalize: identity,
    initial: false,
  },
  'class-map-pruning': {
    extend: overwrite,
    normalize: identity,
    initial: false,
  },
  'app-name': {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  'map-name': {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  labels: {
    extend: prepend,
    normalize: identity,
    initial: [],
  },
  feature: {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  'feature-group': {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  frameworks: {
    extend: prepend,
    normalize: normalizeFrameworks,
    initial: [],
  },
};

////////////
// export //
////////////

const makeInitialFieldObject = () => {
  const data = { __proto__: null };
  for (const key in infos) {
    data[key] = infos[key].initial;
  }
  return data;
};

const extendField = (data, key, value) => {
  assert(key in infos, `invalid field key %o`, key);
  const { normalize, extend } = infos[key];
  extend(data, key, normalize(value));
};

const npm = JSON.parse(
  FileSystem__namespace.readFileSync(Path__namespace.join(home_1, 'package.json'), 'utf8'),
);

const isEnabledDefault = { enabled: false };

const getInstrumentationDefault = {
  enabled: false,
  shallow: false,
  exclude: [],
};

const parsers = {
  __proto__: null,
  '.json': JSON.parse,
  '.yml': YAML__default['default'].parse,
  '.yaml': YAML__default['default'].parse,
};

class Configuration {
  constructor(data) {
    this.data = data;
  }
  extendWithData(data2, done = []) {
    return validateConfiguration(data2).bind((data2) =>
      changeWorkingDirectory(data2.cwd, () => {
        data2 = { ...data2 };
        delete data2.cwd;
        data2 = { __proto__: null, ...data2 };
        let either;
        if ('extends' in data2) {
          if (typeof data2.extends === 'string') {
            either = this.extendWithFile(resolvePath(data2.extends), done);
          } else {
            either = this.extendWithData(data2.extends, done);
          }
          delete data2.extends;
        } else {
          either = new Right(this);
        }
        return either.mapRight(({ data: data1 }) => {
          data1 = { __proto__: null, ...data1 };
          for (const key in data2) {
            extendField(data1, key, data2[key]);
          }
          return new Configuration(data1);
        });
      }),
    );
  }
  extendWithFile(path, done = []) {
    path = Path__namespace.resolve(path);
    const parse = parsers[Path__namespace.extname(path)];
    if (parse === undefined) {
      return new Left(
        `invalid extension for configuration file ${JSON.stringify(
          path,
        )}, expected one of: ${Reflect.ownKeys(parsers).join(', ')}`,
      );
    }
    if (done.includes(path)) {
      return new Left(
        `detected loop in configuration file hierarchy ${[...done, path]
          .map(JSON.stringify)
          .join(' -> ')}`,
      );
    }
    let content;
    try {
      content = FileSystem__namespace.readFileSync(path, 'utf8');
    } catch (error) {
      return new Left(
        `failed to read configuration file ${path} >> ${error.message}`,
      );
    }
    let data;
    try {
      data = parse(content);
    } catch (error) {
      return new Left(
        `failed to parse configuration file ${path} >> ${error.message}`,
      );
    }
    data = {
      cwd: Path__namespace.dirname(path),
      ...data,
    };
    return this.extendWithData(data, [...done, path]);
  }
  isEnabled() {
    if (this.data.main.path === null) {
      return new Left('missing main path for availability query');
    }
    return new Right(
      lookupNormalizedSpecifierArray(
        this.data.enabled,
        this.data.main.path,
        isEnabledDefault,
      ).enabled,
    );
  }
  isClassMapPruned() {
    return this.data['class-map-pruning'];
  }
  isEventPruned() {
    return this.data['event-pruning'];
  }
  getEscapePrefix() {
    return this.data['escape-prefix'];
  }
  getLanguageVersion() {
    return this.data.language.version;
  }
  getInstrumentation(path) {
    const { enabled, shallow, exclude } = lookupNormalizedSpecifierArray(
      this.data.packages,
      path,
      getInstrumentationDefault,
    );
    return {
      source: this.data.source,
      enabled,
      shallow,
      exclude: [...exclude, ...this.data.exclude],
    };
  }
  getBaseDirectory() {
    return this.data.base.directory;
  }
  getOutputPath() {
    let filename = 'anonymous';
    if (this.data.output['file-name'] !== null) {
      filename = this.data.output['file-name'];
    } else if (this.data['map-name'] !== null) {
      filename = this.data['map-name'];
    } else if (this.data.main.path !== null) {
      filename = this.data.main.path;
    }
    return Path__namespace.join(
      this.data.output.directory,
      filename.replace(/[/\t\n ]/g, '-'),
    );
  }
  getMetaData() {
    return {
      name: this.data['map-name'],
      labels: this.data.labels,
      app: this.data['app-name'],
      feature: this.data.feature,
      feature_group: this.data['feature-group'],
      language: {
        name: this.data.language.name,
        version: this.data.language.version,
        engine:
          this.data.engine.name === null
            ? null
            : `${this.data.engine.name}@${this.data.engine.version}`,
      },
      frameworks: this.data.frameworks,
      client: {
        name: npm.name,
        url: npm.repository.url,
        version: npm.version,
      },
      recorder: {
        name: this.data.recorder,
      },
      recording: this.data.recording,
      git: this.data.base.git,
    };
  }
  getHooks() {
    return this.data.hooks;
  }
  getConcurrency() {
    return this.data.concurrency;
  }
  getProtocol() {
    return this.data.protocol;
  }
  getHost() {
    return this.data.host;
  }
  getPort() {
    return this.data.port;
  }
  getChildren() {
    return this.data.children;
  }
  spawnChild(child) {
    return spawnNormalizedChild(child, this);
  }
  serialize() {
    return JSON.stringify({
      cwd: '/',
      ...this.data,
    });
  }
}

const configuration = new Configuration(makeInitialFieldObject());

const getInitialConfiguration = () => configuration;

class EitherMap extends Map {
  constructor() {
    super();
    this.counter = 0n;
  }
  push(value) {
    this.counter += 1n;
    const key = this.counter.toString(36);
    super.set(key, value);
    return key;
  }
  take(key) {
    if (super.has(key)) {
      const value = super.get(key);
      super.delete(key);
      return new Right(value);
    }
    return new Left(`missing key: ${key}`);
  }
  get(key) {
    if (super.has(key)) {
      return new Right(super.get(key));
    }
    return new Left(`missing key: ${key}`);
  }
  set(key, value) {
    if (super.has(key)) {
      super.set(key, value);
      return new Right(null);
    }
    return new Left(`missing key: ${key}`);
  }
  delete(key) {
    if (super.delete(key)) {
      return new Right(null);
    }
    return new Left(`missing key: ${key}`);
  }
}

const getBound = ({ bound }) => bound;

const getNotBound = ({ bound }) => !bound;

const getKeyName = (location) => {
  assert(
    location.node.type === 'Property' ||
      location.node.type === 'MethodDefinition',
    'invalid node type %o',
    location.node.type,
  );
  if (location.node.computed) {
    return '[#computed]';
  }
  if (location.node.key.type === 'Identifier') {
    return location.node.key.name;
  }
  assert(location.node.key.type === 'Literal', 'invalid non-computed key node');
  assert(
    typeof location.node.key.value === 'string',
    'invalid non-computed key literal node',
  );
  return JSON.stringify(location.node.key.value);
};

const getName = (location) => {
  if (location.name === null) {
    location.name = computeName(location);
  }
  return location.name;
};

const tags = {
  __proto__: null,
  ObjectExpression: 'object',
  ArrowFunctionExpression: 'arrow',
  FunctionExpression: 'function',
  FunctionDeclaration: 'function',
  ClassExpression: 'class',
  ClassDeclaration: 'class',
};

const isObjectBound = (location) =>
  location.parent.node.type === 'Property' &&
  location.parent.node.value === location.node &&
  location.parent.parent.node.type === 'ObjectExpression';

const isClassBound = (location) =>
  location.parent.node.type === 'MethodDefinition' &&
  location.parent.node.value === location.node &&
  location.parent.parent.node.type === 'ClassBody';

const isBound = (location) => isObjectBound(location) || isClassBound(location);

const computeName = (location) => {
  // assert(location.hasName(), 'invalid node type %o for name query', location.node.type);
  // if (location.node.type === "Program") {
  //   return `#${location.common.file.getRelativePath()}`;
  // }
  assert(
    location.node.type in tags,
    'invalid node type %o for computing name',
    location.node.type,
  );
  if (isObjectBound(location)) {
    let name = '';
    if (location.parent.node.kind !== 'init') {
      name = `${name}${location.parent.node.kind} `;
    }
    name = `${name}${getKeyName(location.parent)}`;
    return name;
  }
  if (isClassBound(location)) {
    if (location.parent.node.kind === 'constructor') {
      return 'constructor';
    }
    let name = getKeyName(location.parent);
    if (location.parent.node.kind !== 'method') {
      name = `${location.parent.node.kind} ${name}`;
    }
    return name;
  }
  if (
    location.node.type === 'FunctionDeclaration' ||
    location.node.type === 'ClassDeclaration'
  ) {
    return location.node.id === null ? 'default' : location.node.id.name;
  }
  if (
    (location.node.type === 'FunctionExpression' ||
      location.node.type === 'ClassExpression') &&
    location.node.id !== null
  ) {
    return location.node.id.name;
  }
  if (
    location.parent.node.type === 'AssignmentExpression' &&
    location.parent.node.right === location.node &&
    location.parent.node.operator === '=' &&
    location.parent.node.left.type === 'Identifier'
  ) {
    return location.parent.node.left.name;
  }
  if (
    location.parent.node.type === 'VariableDeclarator' &&
    location.parent.node.init === location.node &&
    location.parent.node.id.type === 'Identifier'
  ) {
    return location.parent.node.id.name;
  }
  const tag = tags[location.node.type];
  return `${tag}-${(location.common.counters[tag] += 1)}`;
};

class Location {
  constructor(node, location, common) {
    this.node = node;
    this.parent = location;
    this.common = common;
    this.name = null;
  }
  extend(node) {
    return new Location(node, this, this.common);
  }
  getOrigin(node) {
    return this.common.origin;
  }
  getSession(node) {
    return this.common.session;
  }
  getFile() {
    return this.common.file;
  }
  getClosureDesignator() {
    assert(
      this.node.type === 'ArrowFunctionExpression' ||
        this.node.type === 'FunctionExpression' ||
        this.node.type === 'FunctionDeclaration',
      'invalid node type %o for getClosureKey',
      this.node.type,
    );
    return {
      path: this.common.file.getRelativePath(),
      lineno: this.node.loc.start.line,
      static:
        this.node.type === 'FunctionExpression' &&
        this.parent.node.type === 'MethodDefinition' &&
        this.parent.node.value === this.node &&
        this.parent.node.static,
      defined_class: getName(this),
      method_id: getName(this),
    };
  }
  isExcluded() {
    return this.node.type in tags && this.common.exclude.has(getName(this));
  }
  isNonScopingIdentifier() {
    assert(
      this.node.type === 'Identifier',
      'invalid node type %o',
      this.node.type,
    );
    if (
      this.parent.node.type === 'BreakStatement' ||
      this.parent.node.type === 'ContinueStatement' ||
      this.parent.node.type === 'LabeledStatement'
    ) {
      return this.parent.node.label === this.node;
    }
    if (this.parent.node.type === 'ExportSpecifier') {
      return this.parent.node.exported === this.node;
    }
    if (this.parent.node.type === 'ImportSpecifier') {
      return this.parent.node.imported === this.node;
    }
    if (this.parent.node.type === 'MemberExpression') {
      return (
        this.parent.node.property === this.node && !this.parent.node.computed
      );
    }
    if (
      this.parent.node.type === 'MethodDefinition' ||
      this.parent.node.type === 'Property'
    ) {
      return this.parent.node.key === this.node && !this.node.computed;
    }
    return false;
  }
  wrapEntityArray(entities) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      assert(
        entities.every(getNotBound),
        'unbound code entity escaped to closure',
      );
      const designator = this.getClosureDesignator();
      return [
        {
          type: 'class',
          name: designator.defined_class,
          bound: isBound(this),
          children: [
            {
              type: 'function',
              source: this.common.source
                ? this.common.file
                    .getContent()
                    .substring(this.node.start, this.node.end)
                : null,
              labels: [],
              comment: null,
              name: designator.method_id,
              location: `${designator.path}:${designator.lineno}`,
              static: designator.static,
            },
            ...entities,
          ],
        },
      ];
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration'
    ) {
      return [
        {
          type: 'class',
          name: getName(this),
          bound: isBound(this),
          children: entities.filter(getBound),
        },
        ...entities.filter(getNotBound),
      ];
    }
    return entities;
  }
}

class RootLocation {
  constructor(common) {
    this.node = null;
    this.parent = null;
    this.common = common;
  }
  extend(node) {
    return new Location(node, this, this.common);
  }
  getFile() {
    return this.common.file;
  }
}

const visitors = { __proto__: null };

const setVisitor = (type, split, join) => {
  visitors[type] = { split, join };
};

const empty = [];

const getEmptyArray = () => empty;

const singleton = {
  node: null,
  entities: empty,
};

const getEmptyResult = () => singleton;

const getResultEntities = ({ entities }) => entities;

const getResultNode = ({ node }) => node;

const visit = (node, location) => {
  location = location.extend(node);
  let entities = [];
  assert(node.type in visitors, 'invalid node type %o', node.type);
  if (!location.isExcluded()) {
    const { split, join } = visitors[node.type];
    const parts = split(node, location);
    const fields = [];
    for (let index = 0; index < parts.length; index += 1) {
      if (Array.isArray(parts[index])) {
        entities.push(...parts[index].flatMap(getResultEntities));
        fields[index] = parts[index].map(getResultNode);
      } else {
        entities.push(...parts[index].entities);
        fields[index] = parts[index].node;
      }
    }
    node = join(node, location, ...fields);
    entities = location.wrapEntityArray(entities);
  }
  return {
    node,
    entities,
  };
};

setVisitor(
  'MethodDefinition',
  (node, location) => [visit(node.key, location), visit(node.value, location)],
  (node, location, child1, child2) => ({
    type: 'MethodDefinition',
    kind: node.kind,
    computed: node.computed,
    static: node.static,
    key: child1,
    value: child2,
  }),
);

setVisitor(
  'ClassBody',
  (node, location) => [node.body.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'ClassBody',
    body: children,
  }),
);

{
  const split = (node, location) => [
    node.id === null ? getEmptyResult() : visit(node.id, location),
    node.superClass === null
      ? getEmptyResult()
      : visit(node.superClass, location),
    visit(node.body, location),
  ];
  const join = (node, location, child1, child2, child3) => ({
    type: node.type,
    id: child1,
    superClass: child2,
    body: child3,
  });
  setVisitor('ClassExpression', split, join);
  setVisitor('ClassDeclaration', split, join);
}

/////////////
// Builder //
/////////////

const buildBlockStatement = (nodes) => ({
  type: 'BlockStatement',
  body: nodes,
});

const buildConditionalExpression = (node1, node2, node3) => ({
  type: 'ConditionalExpression',
  test: node1,
  consequent: node2,
  alternate: node3,
});

const buildCatchClause = (node1, node2) => ({
  type: 'CatchClause',
  param: node1,
  body: node2,
});

const buildTryStatement = (node1, node2, node3) => ({
  type: 'TryStatement',
  block: node1,
  handler: node2,
  finalizer: node3,
});

const buildRestElement = (node) => ({
  type: 'RestElement',
  argument: node,
});

const buildBinaryExpression = (operator, node1, node2) => ({
  type: 'BinaryExpression',
  operator,
  left: node1,
  right: node2,
});

const buildAssignmentExpression = (operator, node1, node2) => ({
  type: 'AssignmentExpression',
  operator,
  left: node1,
  right: node2,
});

const buildObjectExpression = (nodes) => ({
  type: 'ObjectExpression',
  properties: nodes,
});

const buildArrayExpression = (nodes) => ({
  type: 'ArrayExpression',
  elements: nodes,
});

const buildThisExpression = () => ({
  type: 'ThisExpression',
});

const buildIdentifier = (name) => ({
  type: 'Identifier',
  name,
});

const buildLiteral = (name) => ({
  type: 'Literal',
  value: name,
});

const buildRegularProperty = (name, node) => ({
  type: 'Property',
  kind: 'init',
  computed: false,
  shorthand: false,
  method: false,
  key: {
    type: 'Identifier',
    name,
  },
  value: node,
});

const buildVariableDeclaration = (kind, nodes) => ({
  type: 'VariableDeclaration',
  kind,
  declarations: nodes,
});

const buildThrowStatement = (node) => ({
  type: 'ThrowStatement',
  argument: node,
});

const buildVariableDeclarator = (node1, node2) => ({
  type: 'VariableDeclarator',
  id: node1,
  init: node2,
});

const buildCallExpression = (node, nodes) => ({
  type: 'CallExpression',
  optional: false,
  callee: node,
  arguments: nodes,
});

const buildExpressionStatement = (node) => ({
  type: 'ExpressionStatement',
  expression: node,
});

const buildRegularMemberExpression = (name1, name2) => ({
  type: 'MemberExpression',
  optional: false,
  computed: false,
  object: buildIdentifier(name1),
  property: buildIdentifier(name2),
});

/////////////////////
// ReturnStatement //
/////////////////////

const joinReturnStatement = (node, location, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(`${location.getSession()}_SUCCESS`),
    child === null
      ? buildRegularMemberExpression(location.getSession(), 'undefined')
      : child,
  ),
});

setVisitor(
  'ReturnStatement',
  (node, location) => [
    node.argument === null ? getEmptyResult() : visit(node.argument, location),
  ],
  joinReturnStatement,
);

/////////////
// Closure //
/////////////

{
  const makeSetupStatement = (node, location) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_TIMER`),
        buildCallExpression(
          buildRegularMemberExpression(location.getSession(), 'getNow'),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_EVENT_ID`),
        buildAssignmentExpression(
          '+=',
          buildRegularMemberExpression(location.getSession(), 'event_counter'),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_SUCCESS`),
        buildRegularMemberExpression(location.getSession(), 'empty'),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${location.getSession()}_FAILURE`),
        buildRegularMemberExpression(location.getSession(), 'empty'),
      ),
    ]);

  const makeEnterStatement = (node, location) => {
    const designator = location.getClosureDesignator();
    return buildExpressionStatement(
      buildCallExpression(
        buildRegularMemberExpression(location.getSession(), 'record'),
        [
          buildLiteral(location.getOrigin()),
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildIdentifier(`${location.getSession()}_EVENT_ID`),
            ),
            buildRegularProperty('event', buildLiteral('call')),
            buildRegularProperty(
              'thread_id',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'getCurrentThreadId',
                ),
                [],
              ),
            ),
            buildRegularProperty(
              'defined_class',
              buildLiteral(designator.defined_class),
            ),
            buildRegularProperty(
              'method_id',
              buildLiteral(designator.method_id),
            ),
            buildRegularProperty('path', buildLiteral(designator.path)),
            buildRegularProperty('lineno', buildLiteral(designator.lineno)),
            buildRegularProperty(
              'receiver',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'serializeParameter',
                ),
                [
                  node.type === 'ArrowFunctionExpression'
                    ? buildRegularMemberExpression(
                        location.getSession(),
                        'empty',
                      )
                    : buildThisExpression(),
                  buildLiteral('this'),
                ],
              ),
            ),
            buildRegularProperty(
              'parameters',
              buildArrayExpression(
                node.params.map((child, index) =>
                  buildCallExpression(
                    buildRegularMemberExpression(
                      location.getSession(),
                      'serializeParameter',
                    ),
                    [
                      buildIdentifier(
                        `${location.getSession()}_ARGUMENT_${String(index)}`,
                      ),
                      buildLiteral(
                        location
                          .getFile()
                          .getContent()
                          .substring(child.start, child.end),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            buildRegularProperty('static', buildLiteral(designator.static)),
          ]),
        ],
      ),
    );
  };

  const makeLeaveStatement = (node, location) =>
    buildExpressionStatement(
      buildCallExpression(
        buildRegularMemberExpression(location.getSession(), 'record'),
        [
          buildLiteral(location.getOrigin()),
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildAssignmentExpression(
                '+=',
                buildRegularMemberExpression(
                  location.getSession(),
                  'event_counter',
                ),
                buildLiteral(1),
              ),
            ),
            buildRegularProperty('event', buildLiteral('return')),
            buildRegularProperty(
              'thread_id',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'getCurrentThreadId',
                ),
                [],
              ),
            ),
            buildRegularProperty(
              'parent_id',
              buildIdentifier(`${location.getSession()}_EVENT_ID`),
            ),
            buildRegularProperty(
              'ellapsed',
              buildBinaryExpression(
                '-',
                buildCallExpression(
                  buildRegularMemberExpression(location.getSession(), 'getNow'),
                  [],
                ),
                buildIdentifier(`${location.getSession()}_TIMER`),
              ),
            ),
            buildRegularProperty(
              'return_value',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'serializeParameter',
                ),
                [
                  buildIdentifier(`${location.getSession()}_SUCCESS`),
                  buildLiteral('return'),
                ],
              ),
            ),
            buildRegularProperty(
              'exceptions',
              buildCallExpression(
                buildRegularMemberExpression(
                  location.getSession(),
                  'serializeException',
                ),
                [buildIdentifier(`${location.getSession()}_FAILURE`)],
              ),
            ),
          ]),
        ],
      ),
    );

  const makeFailureStatement = (node, location) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(`${location.getSession()}_FAILURE`),
        buildIdentifier(`${location.getSession()}_ERROR`),
      ),
    );

  const makeHeadStatementArray = (node, location, children) =>
    children.length === 0
      ? []
      : [
          buildVariableDeclaration(
            'var',
            children.map((child, index) => {
              // Special case for AssignmentPattern:
              //
              // function f (x = {}) {}
              //
              // function f (APPMAP_ARGUMENT_0) {
              //   // does not work :(
              //   var x = {} = APPMAP_ARGUMENT_0;
              // }
              if (child.type === 'AssignmentPattern') {
                return buildVariableDeclarator(
                  child.left,
                  buildConditionalExpression(
                    buildBinaryExpression(
                      '===',
                      buildIdentifier(
                        `${location.getSession()}_ARGUMENT_${String(index)}`,
                      ),
                      buildRegularMemberExpression(
                        location.getSession(),
                        'undefined',
                      ),
                    ),
                    child.right,
                    buildIdentifier(
                      `${location.getSession()}_ARGUMENT_${String(index)}`,
                    ),
                  ),
                );
              }
              return buildVariableDeclarator(
                child,
                buildIdentifier(
                  `${location.getSession()}_ARGUMENT_${String(index)}`,
                ),
              );
            }),
          ),
        ];

  const makeBodyStatementArray = (node, location, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [joinReturnStatement(node, location, child)];

  const joinClosure = (node, location, child1, children, child2) => ({
    type: node.type,
    id: child1,
    expression: false,
    async: node.async,
    generator: node.generator,
    params: node.params.map((child, index) => {
      let pattern = buildIdentifier(
        `${location.getSession()}_ARGUMENT_${String(index)}`,
      );
      if (child.type === 'RestElement') {
        pattern = buildRestElement(pattern);
      }
      return pattern;
    }),
    body: buildBlockStatement([
      makeSetupStatement(node, location),
      makeEnterStatement(node, location),
      buildTryStatement(
        buildBlockStatement([
          ...makeHeadStatementArray(node, location, children),
          ...makeBodyStatementArray(node, location, child2),
        ]),
        buildCatchClause(
          buildIdentifier(`${location.getSession()}_ERROR`),
          buildBlockStatement([makeFailureStatement(node, location)]),
        ),
        buildBlockStatement([makeLeaveStatement(node, location)]),
      ),
    ]),
  });

  const splitClosure = (node, location) => [
    node.type === 'ArrowFunctionExpression' || node.id === null
      ? getEmptyResult()
      : visit(node.id, location),
    node.params.map((child) =>
      visit(child.type === 'RestElement' ? child.argument : child, location),
    ),
    visit(node.body, location),
  ];

  setVisitor('ArrowFunctionExpression', splitClosure, joinClosure);

  setVisitor('FunctionExpression', splitClosure, joinClosure);

  setVisitor('FunctionDeclaration', splitClosure, joinClosure);
}

/////////////
// Literal //
/////////////

// ArrowFunctionExpression cf visit-common-closure.mjs

// FunctionExpression cf visit-common-closure.mjs

// ClassExpression cf visit-common-class.mjs

setVisitor('Literal', getEmptyArray, (node, location) => {
  if (Reflect.getOwnPropertyDescriptor(node, 'regex') !== undefined) {
    return {
      type: 'Literal',
      value: node.value,
      regex: {
        pattern: node.regex.pattern,
        flags: node.regex.flags,
      },
    };
  }
  if (Reflect.getOwnPropertyDescriptor(node, 'bigint') !== undefined) {
    return {
      type: 'Literal',
      value: node.value,
      bigint: node.bigint,
    };
  }
  return {
    type: 'Literal',
    value: node.value,
  };
});

setVisitor('TemplateElement', getEmptyArray, (node, location) => ({
  type: 'TemplateElement',
  tail: node.tail,
  value: {
    cooked: node.value.cooked,
    raw: node.value.raw,
  },
}));

setVisitor(
  'TemplateLiteral',
  (node, location) => [
    node.quasis.map((child) => visit(child, location)),
    node.expressions.map((child) => visit(child, location)),
  ],
  (node, location, children1, children2) => ({
    type: 'TemplateLiteral',
    quasis: children1,
    expressions: children2,
  }),
);

setVisitor(
  'TaggedTemplateExpression',
  (node, location) => [visit(node.tag, location), visit(node.quasi, location)],
  (node, location, child1, child2) => ({
    type: 'TaggedTemplateExpression',
    tag: child1,
    quasi: child2,
  }),
);

setVisitor(
  'SpreadElement',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'SpreadElement',
    argument: child,
  }),
);

setVisitor(
  'ArrayExpression',
  (node, location) => [
    node.elements.map((child) =>
      child == null ? getEmptyResult() : visit(child, location),
    ),
  ],
  (node, location, children) => ({
    type: 'ArrayExpression',
    elements: children,
  }),
);

setVisitor(
  'Property',
  (node, location) => [visit(node.key, location), visit(node.value, location)],
  (node, location, child1, child2) => ({
    type: 'Property',
    kind: node.kind,
    method: node.method,
    computed: node.computed,
    shorthand: false,
    key: child1,
    value: child2,
  }),
);

setVisitor(
  'ObjectExpression',
  (node, location) => [node.properties.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'ObjectExpression',
    properties: children,
  }),
);

/////////////////
// Environment //
/////////////////

// Identifier cf visit-common-other.mjs

setVisitor('Super', getEmptyArray, (node, location) => ({
  type: 'Super',
}));

setVisitor('ThisExpression', getEmptyArray, (node, location) => ({
  type: 'ThisExpression',
}));

setVisitor(
  'AssignmentExpression',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'AssignmentExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'UpdateExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'UpdateExpression',
    prefix: node.prefix,
    operator: node.operator,
    argument: child,
  }),
);

/////////////
// Control //
/////////////

setVisitor(
  'ImportExpression',
  (node, location) => [visit(node.source, location)],
  (node, location, child) => ({
    type: 'ImportExpression',
    source: child,
  }),
);

setVisitor(
  'ChainExpression',
  (node, location) => [visit(node.expression, location)],
  (node, location, child) => ({
    type: 'ChainExpression',
    expression: child,
  }),
);

setVisitor(
  'AwaitExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'AwaitExpression',
    argument: child,
  }),
);

setVisitor(
  'YieldExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'YieldExpression',
    delegate: node.delegate,
    argument: child,
  }),
);

setVisitor(
  'ConditionalExpression',
  (node, location) => [
    visit(node.test, location),
    visit(node.consequent, location),
    visit(node.alternate, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'ConditionalExpression',
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  'LogicalExpression',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'LogicalExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'SequenceExpression',
  (node, location) => [node.expressions.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'SequenceExpression',
    expressions: children,
  }),
);

//////////////////
// Comnbination //
//////////////////

setVisitor(
  'MemberExpression',
  (node, location) => [
    visit(node.object, location),
    visit(node.property, location),
  ],
  (node, location, child1, child2) => ({
    type: 'MemberExpression',
    computed: node.computed,
    optional: node.optional,
    object: child1,
    property: child2,
  }),
);

setVisitor(
  'BinaryExpression',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, child2) => ({
    type: 'BinaryExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'UnaryExpression',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'UnaryExpression',
    operator: node.operator,
    prefix: node.prefix, // always true
    argument: child,
  }),
);

setVisitor(
  'CallExpression',
  (node, location) => [
    visit(node.callee, location),
    node.arguments.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'CallExpression',
    optional: node.optional,
    callee: child,
    arguments: children,
  }),
);

setVisitor(
  'NewExpression',
  (node, location) => [
    visit(node.callee, location),
    node.arguments.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'NewExpression',
    callee: child,
    arguments: children,
  }),
);

class Collision {
  constructor(message) {
    this.message = message;
  }
  getMessage() {
    return this.message;
  }
}

setVisitor('Identifier', getEmptyArray, (node, location) => {
  if (
    node.name.startsWith(location.getSession()) &&
    !location.isNonScopingIdentifier()
  ) {
    // Would be cleaner to use either because this is not a bug
    throw new Collision(
      `identifier collision detected at ${location
        .getFile()
        .getAbsolutePath()}@${node.loc.start.line}-${node.loc.start.column}: ${
        node.name
      } should not start with ${location.getSession()}`,
    );
  }
  return {
    type: 'Identifier',
    name: node.name,
  };
});

// Identifier cf visit-common-other.mjs

setVisitor(
  'AssignmentPattern',
  (node, location) => [visit(node.left, location), visit(node.right, location)],
  (node, location, child1, chidl2) => ({
    type: 'AssignmentPattern',
    left: child1,
    right: chidl2,
  }),
);

// Property cf visit-common-other.mjs
setVisitor(
  'ObjectPattern',
  (node, location) => [node.properties.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'ObjectPattern',
    properties: children,
  }),
);

setVisitor(
  'ArrayPattern',
  (node, location) => [
    node.elements.map((child) =>
      child === null ? getEmptyResult() : visit(child, location),
    ),
  ],
  (node, location, children) => ({
    type: 'ArrayPattern',
    elements: children,
  }),
);

setVisitor(
  'RestElement',
  (node, location) => [visit(node.argument, location)],
  (ndoe, location, child) => ({
    type: 'RestElement',
    argument: child,
  }),
);

setVisitor(
  'Program',
  (node, location) => [node.body.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'Program',
    sourceType: node.sourceType,
    body: children,
  }),
);

////////////
// Atomic //
////////////

// ReturnStatement cf visit-common-closure.mjs

setVisitor('EmptyStatement', getEmptyArray, (node, location) => ({
  type: 'EmptyStatement',
}));

setVisitor(
  'ThrowStatement',
  (node, location) => [visit(node.argument, location)],
  (node, location, child) => ({
    type: 'ThrowStatement',
    argument: child,
  }),
);

setVisitor(
  'ExpressionStatement',
  (node, location) => [visit(node.expression, location)],
  (node, location, child) => ({
    type: 'ExpressionStatement',
    expression: child,
  }),
);

setVisitor('DebuggerStatement', getEmptyArray, (node, location) => ({
  type: 'DebuggerStatement',
}));

setVisitor(
  'BreakStatement',
  (node, location) => [
    node.label === null ? getEmptyResult() : visit(node.label, location),
  ],
  (node, location, child) => ({
    type: 'BreakStatement',
    label: child,
  }),
);

setVisitor(
  'ContinueStatement',
  (node, location) => [
    node.label === null ? getEmptyResult() : visit(node.label, location),
  ],
  (node, location, child) => ({
    type: 'ContinueStatement',
    label: child,
  }),
);

/////////////////
// Declaration //
/////////////////

// FunctionDeclaration cf visit-common-closure.mjs
// ClassDeclaration cf visit-common-class.mjs

setVisitor(
  'VariableDeclarator',
  (node, location) => [
    visit(node.id, location),
    node.init === null ? getEmptyResult() : visit(node.init, location),
  ],
  (node, location, child1, child2) => ({
    type: 'VariableDeclarator',
    id: child1,
    init: child2,
  }),
);

setVisitor(
  'VariableDeclaration',
  (node, location) => [
    node.declarations.map((child) => visit(child, location)),
  ],
  (node, location, children) => ({
    type: 'VariableDeclaration',
    kind: node.kind,
    declarations: children,
  }),
);

setVisitor(
  'ImportSpecifier',
  (node, location) => [
    visit(node.local, location),
    visit(node.imported, location),
  ],
  (node, location, child1, child2) => ({
    type: 'ImportSpecifier',
    local: child1,
    imported: child2,
  }),
);

setVisitor(
  'ImportDefaultSpecifier',
  (node, location) => [visit(node.local, location)],
  (node, location, child) => ({
    type: 'ImportDefaultSpecifier',
    local: child,
  }),
);

setVisitor(
  'ImportNamespaceSpecifier',
  (node, location) => [visit(node.local, location)],
  (node, location, child) => ({
    type: 'ImportNamespaceSpecifier',
    local: child,
  }),
);

setVisitor(
  'ImportDeclaration',
  (node, location) => [
    node.specifiers.map((child) => visit(child, location)),
    visit(node.source, location),
  ],
  (node, location, children, child) => ({
    type: 'ImportDeclaration',
    specifiers: children,
    source: child,
  }),
);

setVisitor(
  'ExportSpecifier',
  (node, location) => [
    visit(node.local, location),
    visit(node.exported, location),
  ],
  (node, location, child1, child2) => ({
    type: 'ExportSpecifier',
    local: child1,
    exported: child2,
  }),
);

setVisitor(
  'ExportNamedDeclaration',
  (node, location) => [
    node.declaration === null
      ? getEmptyResult()
      : visit(node.declaration, location),
    node.specifiers.map((child) => visit(child, location)),
    node.source === null ? getEmptyResult() : visit(node.source, location),
  ],
  (node, location, child1, children, child2) => ({
    type: 'ExportNamedDeclaration',
    declaration: child1,
    specifiers: children,
    source: child2,
  }),
);

setVisitor(
  'ExportDefaultDeclaration',
  (node, location) => [visit(node.declaration, location)],
  (node, location, child) => ({
    type: 'ExportDefaultDeclaration',
    declaration: child,
  }),
);

setVisitor(
  'ExportAllDeclaration',
  (node, location) => [visit(node.source, location)],
  (node, location, child) => ({
    type: 'ExportAllDeclaration',
    source: child,
  }),
);

//////////////
// Compound //
//////////////

setVisitor(
  'BlockStatement',
  (node, location) => [node.body.map((child) => visit(child, location))],
  (node, location, children) => ({
    type: 'BlockStatement',
    body: children,
  }),
);

setVisitor(
  'WithStatement',
  (node, location) => [
    visit(node.object, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2) => ({
    type: 'WithStatement',
    object: child1,
    body: child2,
  }),
);

setVisitor(
  'LabeledStatement',
  (node, location) => [visit(node.label, location), visit(node.body, location)],
  (node, location, child1, child2) => ({
    type: 'LabeledStatement',
    label: child1,
    body: child2,
  }),
);

setVisitor(
  'IfStatement',
  (node, location) => [
    visit(node.test, location),
    visit(node.consequent, location),
    node.alternate === null
      ? getEmptyResult()
      : visit(node.alternate, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'IfStatement',
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  'CatchClause',
  (node, location) => [
    node.param === null ? getEmptyResult() : visit(node.param, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2) => ({
    type: 'CatchClause',
    param: child1,
    body: child2,
  }),
);

setVisitor(
  'TryStatement',
  (node, location) => [
    visit(node.block, location),
    node.handler === null ? getEmptyResult() : visit(node.handler, location),
    node.finalizer === null
      ? getEmptyResult()
      : visit(node.finalizer, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'TryStatement',
    block: child1,
    handler: child2,
    finalizer: child3,
  }),
);

setVisitor(
  'WhileStatement',
  (node, location) => [visit(node.test, location), visit(node.body, location)],
  (node, location, child1, child2) => ({
    type: 'WhileStatement',
    test: child1,
    body: child2,
  }),
);

setVisitor(
  'DoWhileStatement',
  (node, location) => [visit(node.test, location), visit(node.body, location)],
  (node, location, child1, child2) => ({
    type: 'DoWhileStatement',
    test: child1,
    body: child2,
  }),
);

setVisitor(
  'ForStatement',
  (node, location) => [
    node.init === null ? getEmptyResult() : visit(node.init, location),
    node.test === null ? getEmptyResult() : visit(node.test, location),
    node.update === null ? getEmptyResult() : visit(node.update, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2, child3, child4) => ({
    type: 'ForStatement',
    init: child1,
    test: child2,
    update: child3,
    body: child4,
  }),
);

setVisitor(
  'ForOfStatement',
  (node, location) => [
    visit(node.left, location),
    visit(node.right, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'ForOfStatement',
    await: node.await,
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  'ForInStatement',
  (node, location) => [
    visit(node.left, location),
    visit(node.right, location),
    visit(node.body, location),
  ],
  (node, location, child1, child2, child3) => ({
    type: 'ForInStatement',
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  'SwitchCase',
  (node, location) => [
    node.test === null ? getEmptyResult() : visit(node.test, location),
    node.consequent.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'SwitchCase',
    test: child,
    consequent: children,
  }),
);

setVisitor(
  'SwitchStatement',
  (node, location) => [
    visit(node.discriminant, location),
    node.cases.map((child) => visit(child, location)),
  ],
  (node, location, child, children) => ({
    type: 'SwitchStatement',
    discriminant: child,
    cases: children,
  }),
);

const instrument = (options) => {
  try {
    const location = new RootLocation(options);
    return location
      .getFile()
      .parse()
      .mapRight((node) => {
        const result = visit(node, location);
        return {
          content: escodegen.generate(getResultNode(result)),
          entities: getResultEntities(result),
        };
      });
    // c8 vs node12
    /* c8 ignore start */
  } catch (error) {
    /* c8 ignore stop */
    if (error instanceof Collision) {
      return new Left(error.getMessage());
    }
    /* c8 ignore start */ throw error;
  } /* c8 ignore stop */
};

class File {
  constructor(
    version,
    source,
    path,
    content = FileSystem__namespace.readFileSync(path, 'utf8'),
    basedir = process.cwd(),
  ) {
    this.absolute = Path__namespace.resolve(basedir, path);
    this.relative = Path__namespace.relative(basedir, this.absolute);
    this.version = version;
    this.source = source;
    this.content = content;
  }
  getAbsolutePath() {
    return this.absolute;
  }
  getRelativePath() {
    return this.relative;
  }
  getLanguageVersion() {
    return this.version;
  }
  getSourceType() {
    return this.source;
  }
  getContent() {
    return this.content;
  }
  parse() {
    try {
      return new Right(
        acorn.parse(this.content, {
          ecmaVersion: this.version,
          sourceType: this.source,
          locations: true,
        }),
      );
      // c8 vs node12
      /* c8 ignore start */
    } catch (error) {
      /* c8 ignore stop */
      return new Left(`failed to parse ${this.path} >> ${error.message}`);
    }
  }
}

const VERSION = '1.6.0';

const isNotNull = (any) => any !== null;

const resetThreadId = (event) => ({
  ...event,
  thread_id: 0,
});

const manufactureStack = (events) => {
  const stack = [];
  let length = events.length;
  let max = 0;
  for (let event of events) {
    if (event.id > max) {
      max = event.id;
    }
  }
  const makeReturnEvent = (parent) => {
    let event = {
      thread_id: parent.thread_id,
      event: 'return',
      id: (max += 1),
      parent_id: parent.id,
    };
    if (
      Reflect.getOwnPropertyDescriptor(parent, 'http_client_request') !==
      undefined
    ) {
      event = {
        ...event,
        http_client_response: {
          status_code: 100,
        },
      };
    } else if (
      Reflect.getOwnPropertyDescriptor(parent, 'http_server_request') !==
      undefined
    ) {
      event = {
        ...event,
        http_server_response: {
          status_code: 100,
        },
      };
    } else {
      assert(
        Reflect.getOwnPropertyDescriptor(parent, 'sql_query') !== undefined,
        'expected a sql query, got: %o',
        parent,
      );
    }
    return event;
  };
  for (let index1 = 0; index1 < length; index1 += 1) {
    const event1 = events[index1];
    if (event1.event === 'call') {
      stack.push(event1);
      // if (
      //   Reflect.getOwnPropertyDescriptor(event1, 'child_thread_id') !==
      //   undefined
      // ) {
      //   assert(
      //     index1 + 1 < length &&
      //       events[index1 + 1].event === 'return' &&
      //       events[index1 + 1].parent_id === event1.id,
      //     'expected asynchronous jump to be directly followed by its return',
      //   );
      //   const { child_thread_id } = event1;
      //   const child = events.filter(
      //     (event2, index2) =>
      //       index2 > index1 && event2.thread_id === child_thread_id,
      //   );
      //   if (child.length > 0) {
      //     events = [
      //       ...events.slice(0, index1 + 1),
      //       ...child,
      //       ...events.filter(
      //         (event2, index2) =>
      //           index2 > index1 && event2.thread_id !== child_thread_id,
      //       ),
      //     ];
      //   } else {
      //     stack.pop();
      //     events[index1] = null;
      //     index1 += 1;
      //     events[index1] = null;
      //   }
      // }
    } else {
      assert(event1.event === 'return', 'invalid event %o', event1);
      const parent = stack.pop();
      const parent_id = parent.id;
      if (event1.parent_id !== parent_id) {
        assert(
          Reflect.getOwnPropertyDescriptor(parent, 'http_server_request') !==
            undefined ||
            Reflect.getOwnPropertyDescriptor(parent, 'http_client_request') !==
              undefined ||
            Reflect.getOwnPropertyDescriptor(parent, 'sql_query') !== undefined,
          'function call event should be matched by a function return event; parent: %o child: %o',
          parent,
          event1,
        );
        const index2 = events.findIndex(
          (event2, index2) =>
            index2 > index1 &&
            event2.event === 'return' &&
            event2.parent_id === parent_id,
        );
        if (index2 === -1) {
          length += 1;
          events = [
            ...events.slice(0, index1),
            makeReturnEvent(parent),
            ...events.slice(index1),
          ];
        } else {
          const child_thread_id = events[index2].thread_id;
          events = [
            ...events.slice(0, index1),
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id === child_thread_id,
            ),
            event1,
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id !== child_thread_id,
            ),
          ];
        }
      }
    }
  }
  if (stack.length > 0) {
    events = [...events, ...stack.reverse().map(makeReturnEvent)];
  }
  return events.filter(isNotNull).map(resetThreadId);
};

const navigate = (children, name) => {
  for (const child of children) {
    if (child.type === 'package' && child.name === name) {
      return child.children;
    }
  }
  const child = {
    type: 'package',
    name,
    children: [],
  };
  children.push(child);
  return child.children;
};

const split = (path) => {
  if (path === '') {
    return [];
  }
  return path.split(Path__namespace.sep);
};

const save = (recording, versioning) => {
  assert(recording.running !== null, 'terminated recording %o', recording);
  recording.running = null;
  const roots = [];
  for (const { path, entities } of recording.origins) {
    split(
      Path__namespace.relative(
        recording.configuration.getBaseDirectory(),
        Path__namespace.dirname(path),
      ),
    )
      .reduce(navigate, roots)
      .push({
        type: 'package',
        name: Path__namespace.basename(path),
        children: entities,
      });
  }
  return {
    content: JSON.stringify({
      version: VERSION,
      metadata: recording.configuration.getMetaData(),
      classMap: roots,
      events: manufactureStack(recording.events),
    }),
    path: `${versioning(recording.configuration.getOutputPath())}.appmap.json`,
  };
};

class Recording {
  constructor(configuration) {
    this.configuration = configuration;
    this.events = [];
    this.origins = new Set();
    this.running = true;
  }
  terminate(versioning) {
    const { path, content } = save(this, versioning);
    try {
      FileSystem__namespace.writeFileSync(path, content, 'utf8');
    } catch (error) {
      return new Left(
        `failed to write appmap to file ${path} >> ${error.message}`,
      );
    }
    return new Right(null);
  }
  terminateAsync(versioning) {
    const { path, content } = save(this, versioning);
    return new Promise((resolve, reject) => {
      FileSystem__namespace.writeFile(path, content, 'utf8', (error) => {
        if (error) {
          resolve(
            new Left(
              `failed to write appmap to file ${path} >> ${error.message}`,
            ),
          );
        } else {
          resolve(new Right(null));
        }
      });
    });
  }
  toggle(running) {
    assert(this.running !== null, 'terminated recording %o', this);
    if (this.running === running) {
      return new Left('the recording is already in the desired state');
    }
    this.running = running;
    return new Right(null);
  }
  register(origin) {
    assert(this.running !== null, 'terminated recording %o', this);
    if (this.running && !this.configuration.isClassMapPruned()) {
      this.origins.add(origin);
    }
  }
  record(origin, event) {
    assert(this.running !== null, 'terminated recording %o', this);
    if (origin === null) {
      this.events.push(event);
    } else {
      if (this.running) {
        if (this.configuration.isEventPruned()) {
          if (this.origins.has(origin)) {
            this.events.push(event);
          }
        } else {
          this.origins.add(origin);
          this.events.push(event);
        }
      }
    }
  }
}

class Appmap {
  constructor(configuration, versioning) {
    this.versioning = versioning;
    this.session = null;
    this.configuration = configuration;
    this.origins = new EitherMap();
    this.recordings = new EitherMap();
    this.terminated = false;
    this.counters = {
      object: 0,
      arrow: 0,
      class: 0,
      function: 0,
    };
  }
  initialize(session) {
    assert(this.session === null, 'already initialized appmap %o', this);
    this.session = session;
    return new Right({
      session: session,
      hooks: this.configuration.getHooks(),
    });
  }
  initializeAsync(session) {
    return Promise.resolve(this.initialize(session));
  }
  terminate(reason) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    this.terminated = true;
    return forEither(this.recordings.values(), (recording) =>
      recording.terminate(this.versioning),
    );
  }
  terminateAsync(reason) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    this.terminated = true;
    return forEitherAsync(this.recordings.values(), (recording) =>
      recording.terminateAsync(this.versioning),
    );
  }
  instrument({ source, path, content }) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    if (!Path__namespace.isAbsolute(path)) {
      return new Left(`expected an absolute path and got: ${path}`);
    }
    const instrumentation = this.configuration.getInstrumentation(path);
    if (!instrumentation.enabled) {
      return new Right(content);
    }
    const origin = {
      path,
      entities: null,
    };
    const key = this.origins.push(origin);
    return instrument({
      file: new File(
        this.configuration.getLanguageVersion(),
        source,
        path,
        content,
        this.configuration.getBaseDirectory(),
      ),
      session: this.session,
      origin: key,
      exclude: new Set(instrumentation.exclude),
      shallow: instrumentation.shallow,
      source: instrumentation.source,
      counters: this.counters,
    })
      .mapLeft((message) => {
        this.origins.delete(key).fromRight();
        return message;
      })
      .mapRight(({ entities, content }) => {
        origin.entities = entities;
        for (const recording of this.recordings.values()) {
          recording.register(origin);
        }
        return content;
      });
  }
  instrumentAsync(data) {
    return Promise.resolve(this.instrument(data));
  }
  start(data) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.configuration
      .extendWithData(data)
      .mapRight((configuration) =>
        this.recordings.push(new Recording(configuration)),
      );
  }
  startAsync(data) {
    return Promise.resolve(this.start(data));
  }
  play(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings.get(key).bind((recording) => recording.toggle(true));
  }
  playAsync(key) {
    return Promise.resolve(this.play(key));
  }
  pause(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings
      .get(key)
      .bind((recording) => recording.toggle(false));
  }
  pauseAsync(key) {
    return Promise.resolve(this.pause(key));
  }
  stop(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings
      .take(key)
      .bind((recording) => recording.terminate(this.versioning));
  }
  stopAsync(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings
      .take(key)
      .bindAsync((recording) => recording.terminateAsync(this.versioning));
  }
  record({ origin: key, event }) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    if (key === null) {
      for (const recording of this.recordings.values()) {
        recording.record(null, event);
      }
      return new Right(null);
    }
    return this.origins.get(key).mapRight((origin) => {
      for (const recording of this.recordings.values()) {
        recording.record(origin, event);
      }
      return null;
    });
  }
  recordAsync(data) {
    return Promise.resolve(this.record(data));
  }
}

const getLast = (array) => array[array.length - 1];

const right = new Right(null);

const dummy = {
  appmap: {
    initialize: (session) => /* assert(session === null) */ right,
    initializeAsync: (session) =>
      /* assert(session === null) */ Promise.resolve(right),
  },
  action: 'initialize',
  data: null,
};

const execute = ({ appmap, action, data }) => appmap[action](data);

const executeAsync = ({ appmap, action, data }) =>
  appmap[`${action}Async`](data);

class Dispatching {
  constructor(configuration) {
    this.configuration = configuration;
    const paths = new Map();
    this.versioning = (path) => {
      if (paths.has(path)) {
        const counter = paths.get(path) + 1;
        paths.set(path, counter);
        return `${path}-${counter.toString(10)}`;
      }
      paths.set(path, 0);
      return path;
    };
    this.appmaps = new EitherMap();
    this.terminated = false;
    this.prepare = (request) => {
      logger.info('request %s on %j', request.action, request.session);
      if (request.action === 'initialize') {
        return configuration
          .extendWithData(request.data)
          .bind((configuration) =>
            configuration.isEnabled().mapRight((enabled) => {
              if (enabled) {
                const appmap = new Appmap(configuration, this.versioning);
                const key = this.appmaps.push(appmap);
                return {
                  appmap,
                  action: 'initialize',
                  data: `${configuration.getEscapePrefix()}_${key}`,
                };
              }
              return dummy;
            }),
          );
      }
      return this.appmaps[request.action === 'terminate' ? 'take' : 'get'](
        getLast(request.session.split('_')),
      ).mapRight((appmap) => ({
        appmap,
        action: request.action,
        data: request.data,
      }));
    };
  }
  dispatch(request) {
    assert(!this.terminated, 'terminated dispatching %o', this);
    return validateRequest(request).bind(this.prepare).bind(execute);
  }
  terminate() {
    assert(!this.terminated, 'terminated dispatching %o', this);
    this.terminated = true;
    return forEither(this.appmaps.values(), (appmap) => appmap.terminate());
  }
  dispatchAsync(request) {
    assert(!this.terminated, 'terminated dispatching %o', this);
    return validateRequest(request).bind(this.prepare).bindAsync(executeAsync);
  }
  terminateAsync() {
    assert(!this.terminated, 'terminated dispatching %o', this);
    this.terminated = true;
    return forEitherAsync(this.appmaps.values(), (appmap) =>
      appmap.terminateAsync(),
    );
  }
}

const unwrap = (either) => either.unwrap();

const makeChannel = () => {
  const dispatching = new Dispatching(getInitialConfiguration());
  return {
    request: (data) => {
      logger.debug('inline request (synchronous): %j', data);
      return dispatching.dispatch(data).unwrap();
    },
    requestAsync: (data) => {
      logger.debug('inline request (asynchronous): %j', data);
      return dispatching.dispatchAsync(data).then(unwrap);
    },
  };
};

exports.makeChannel = makeChannel;
