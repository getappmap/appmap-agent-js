'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Util = require('util');
var FileSystem = require('fs');
var Path = require('path');
var YAML = require('yaml');
var Ajv = require('ajv');
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

const forEitherAsync = async (iterator, closure) => {
  const step = async () => {
    const { done, value } = iterator.next();
    if (done) {
      return new Right(null);
    }
    return (await closure(value)).bind(step);
  };
  return await step();
};

const ajv = new Ajv__default['default']();
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
    const error = callback.errors[0];
    return new Left(
      `invalid ${name} at ${error.schemaPath}, it ${
        error.message
      } (${JSON.stringify(error.params)})`,
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
  } finally {
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

const escape = (char) => `\\${char}`;

const sanitizeForRegExp = (string) =>
  string.replace(/[/\\+*?.^$()[\]{}|]/g, escape);

const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

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
  Path__namespace.join(
    home_1,
    'lib',
    'client',
    'es2015',
    mapping[version],
    'hook',
    'esm.js',
  );

const getRecorderPath = (version, name) =>
  Path__namespace.join(
    home_1,
    'lib',
    'client',
    'es2015',
    mapping[version],
    'recorder',
    `${name}-bin.js`,
  );

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
      'node-version': '14.x',
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
    child.options.env.NODE_OPTIONS += ` --experimental-loader=${getLoaderPath(
      child['node-version'],
    )}`;
    if (child.recorder === 'mocha') {
      return [
        {
          type: 'cooked',
          cwd,
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
        type: 'cooked',
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
      'node-version': '14.x',
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
      '--experimental-loader',
      getLoaderPath(child['node-version']),
    ];
    if (child.recorder === 'normal') {
      argv.push('--require', getRecorderPath(child['node-version'], 'normal'));
    }
    return (child.globbing
      ? Glob__namespace.default.sync(child.main, { cwd, nodir: true })
      : [resolvePath(child.main)]
    ).map((main) => ({
      type: 'cooked',
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
  'hook-cjs': {
    extend: overwrite,
    normalize: identity,
    initial: true,
  },
  'hook-esm': {
    extend: overwrite,
    normalize: identity,
    initial: true,
  },
  'hook-http': {
    extend: overwrite,
    normalize: identity,
    initial: true,
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
    initial: {
      'defined-class': null,
      'method-id': null,
    },
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
    } else if (this.data.main.path !== null) {
      filename = this.data.main.path.replace(/\//g, '-');
    } else if (this.data['map-name'] !== null) {
      filename = this.data['map-name'].replace(/\//g, '-');
    }
    return Path__namespace.join(this.data.output.directory, filename);
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
  getHooking() {
    return {
      esm: this.data['hook-esm'],
      cjs: this.data['hook-cjs'],
      http: this.data['hook-http'],
    };
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
  getChilderen() {
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

const getPatternName = (node) => {
  if (node === null) {
    return '@#default';
  }
  if (node.type === 'Identifier') {
    return `@${node.name}`;
  }
  return `@#pattern`;
};

const getKeyName = (node) => {
  if (
    node.key.type === 'Literal' &&
    Reflect.getOwnPropertyDescriptor(node, 'regex') === undefined
  ) {
    return `[${JSON.stringify(node.key.value)}]`;
  }
  if (!node.computed && node.key.type === 'Identifier') {
    return `.${node.key.name}`;
  }
  return '[#dynamic]';
};

class Location {
  constructor(node, location, file) {
    this.node = node;
    this.parent = location;
    this.file = file;
  }
  extend(node) {
    return new Location(node, this, this.file);
  }
  getFile() {
    return this.file;
  }
  getKind() {
    if (this.node.type !== 'VariableDeclaration') {
      throw new Error(
        `Expected node to be of type VariableDeclaration and got: ${this.node.type}`,
      );
    }
    return this.node.kind;
  }
  getChildName(node) {
    if (this.node.type === 'VariableDeclarator' && this.node.init === node) {
      return `${getPatternName(this.node.id)}|${this.parent.getKind()}`;
    }
    if (this.node.type === 'AssignmentExpression' && this.node.right === node) {
      return `${getPatternName(this.node.left)}|assignment`;
    }
    if (this.node.type === 'MethodDefinition' && this.node.value === node) {
      return `${this.node.static ? 'constructor' : 'prototype'}${getKeyName(
        this.node,
      )}|${this.node.kind}`;
    }
    if (this.node.type === 'Property' && this.node.value === node) {
      return `singleton${getKeyName(this.node)}|${
        this.node.method ? 'method' : this.node.kind
      }`;
    }
    return `§none`;
  }
  getName() {
    if (this.node.type === 'FunctionDeclaration') {
      return `${getPatternName(this.node.id)}|function`;
    }
    if (this.node.type === 'ClassDeclaration') {
      return `${getPatternName(this.node.id)}|class`;
    }
    if (this.node.type === 'ClassBody') {
      return this.parent.getName();
    }
    if (this.node.type === 'Program') {
      return this.file.getPath();
    }
    return this.parent.getChildName(this.node);
  }
  getParentContainerName() {
    return this.parent.getContainerName();
  }
  getContainerName() {
    if (
      this.node.type === 'Program' ||
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration' ||
      this.node.type === 'ArrowFunctionExpression'
    ) {
      return this.getName();
    }
    return this.parent.getContainerName();
  }
  isChildStaticMethod(node) {
    return (
      node.type === 'FunctionExpression' &&
      this.node.type === 'MethodDefinition' &&
      this.node.value === node &&
      this.node.static
    );
  }
  isStaticMethod() {
    return this.parent.isChildStaticMethod(this.node);
  }
  getStartLine() {
    return this.node.loc.start.line;
  }
  getStartColumn() {
    return this.node.loc.start.column;
  }
  isChildNonScopingIdentifier(node) {
    if (node.type !== 'Identifier') {
      throw new Error(
        `isChildScopingIdentifier should only be called on Identifier node, got: ${node.type}`,
      );
    }
    if (
      this.node.type === 'BreakStatement' ||
      this.node.type === 'ContinueStatement' ||
      this.node.type === 'LabeledStatement'
    ) {
      return this.node.label === node;
    }
    if (this.node.type === 'ExportSpecifier') {
      return this.node.exported === node;
    }
    if (this.node.type === 'ImportSpecifier') {
      return this.node.imported === node;
    }
    if (this.node.type === 'MemberExpression') {
      return this.node.property === node && !this.node.computed;
    }
    if (
      this.node.type === 'MethodDefinition' ||
      this.node.type === 'Property'
    ) {
      return this.node.key === node && !this.node.computed;
    }
    return false;
  }
  isNonScopingIdentifier() {
    return this.parent.isChildNonScopingIdentifier(this.node);
  }
  makeEntity(children) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      return {
        type: 'class',
        name: this.getName(),
        children: [
          {
            type: 'function',
            name: '()',
            source: this.file
              .getContent()
              .substring(this.node.start, this.node.end),
            location: `${this.file.getPath()}:${this.node.loc.start.line}`,
            labels: [],
            comment: null,
            static: this.isStaticMethod(),
          },
        ].concat(children),
      };
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassBody'
    ) {
      return {
        type: 'class',
        name: this.getName(),
        children,
      };
    }
    return null;
  }
}

class RootLocation {
  constructor(file) {
    this.file = file;
  }
  extend(node) {
    return new Location(node, this, this.file);
  }
  getFile(node) {
    return this.file;
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

const visit = (node, { location, options }) => {
  location = location.extend(node);
  let entities = [];
  assert(node.type in visitors, 'invalid node type %o', node.type);
  if (!options.exclude.has(location.getName())) {
    const context = { location, options };
    const { split, join } = visitors[node.type];
    const parts = split(node, context);
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
    node = join(node, context, ...fields);
    const entity = location.makeEntity(entities);
    if (entity !== null) {
      entities = [entity];
    }
  }
  return {
    node,
    entities,
  };
};

setVisitor(
  'MethodDefinition',
  (node, context) => [visit(node.key, context), visit(node.value, context)],
  (node, context, child1, child2) => ({
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
  (node, context) => [node.body.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'ClassBody',
    body: children,
  }),
);

{
  const split = (node, context) => [
    node.id === null ? getEmptyResult() : visit(node.id, context),
    node.superClass === null
      ? getEmptyResult()
      : visit(node.superClass, context),
    visit(node.body, context),
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

const joinReturnStatement = (node, { options: { session } }, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(`${session}_SUCCESS`),
    child === null ? buildRegularMemberExpression(session, 'undefined') : child,
  ),
});

setVisitor(
  'ReturnStatement',
  (node, context) => [
    node.argument === null ? getEmptyResult() : visit(node.argument, context),
  ],
  joinReturnStatement,
);

/////////////
// Closure //
/////////////

{
  const makeSetupStatement = (node, { options: { session } }) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(`${session}_TIMER`),
        buildCallExpression(
          buildRegularMemberExpression(session, 'getNow'),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${session}_EVENT_ID`),
        buildAssignmentExpression(
          '+=',
          buildRegularMemberExpression(session, 'event'),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${session}_SUCCESS`),
        buildRegularMemberExpression(session, 'empty'),
      ),
      buildVariableDeclarator(
        buildIdentifier(`${session}_FAILURE`),
        buildRegularMemberExpression(session, 'empty'),
      ),
    ]);

  const makeEnterStatement = (
    node,
    { location, options: { origin, session } },
  ) =>
    buildExpressionStatement(
      buildCallExpression(buildRegularMemberExpression(session, 'record'), [
        buildLiteral(origin),
        buildObjectExpression([
          buildRegularProperty('id', buildIdentifier(`${session}_EVENT_ID`)),
          buildRegularProperty('event', buildLiteral('call')),
          buildRegularProperty(
            'thread_id',
            buildRegularMemberExpression(session, 'pid'),
          ),
          buildRegularProperty(
            'defined_class',
            buildLiteral(location.getParentContainerName()),
          ),
          buildRegularProperty('method_id', buildLiteral(location.getName())),
          buildRegularProperty(
            'path',
            buildLiteral(location.getFile().getPath()),
          ),
          buildRegularProperty('lineno', buildLiteral(location.getStartLine())),
          buildRegularProperty(
            'receiver',
            buildCallExpression(
              buildRegularMemberExpression(session, 'serializeParameter'),
              [
                node.type === 'ArrowFunctionExpression'
                  ? buildRegularMemberExpression(session, 'empty')
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
                  buildRegularMemberExpression(session, 'serializeParameter'),
                  [
                    buildIdentifier(`${session}_ARGUMENT_${String(index)}`),
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
          buildRegularProperty(
            'static',
            buildLiteral(location.isStaticMethod()),
          ),
        ]),
      ]),
    );

  const makeLeaveStatement = (node, { options: { session, origin } }) =>
    buildExpressionStatement(
      buildCallExpression(buildRegularMemberExpression(session, 'record'), [
        buildLiteral(origin),
        buildObjectExpression([
          buildRegularProperty(
            'id',
            buildAssignmentExpression(
              '+=',
              buildRegularMemberExpression(session, 'event'),
              buildLiteral(1),
            ),
          ),
          buildRegularProperty('event', buildLiteral('return')),
          buildRegularProperty(
            'thread_id',
            buildRegularMemberExpression(session, 'pid'),
          ),
          buildRegularProperty(
            'parent_id',
            buildIdentifier(`${session}_EVENT_ID`),
          ),
          buildRegularProperty(
            'ellapsed',
            buildBinaryExpression(
              '-',
              buildCallExpression(
                buildRegularMemberExpression(session, 'getNow'),
                [],
              ),
              buildIdentifier(`${session}_TIMER`),
            ),
          ),
          buildRegularProperty(
            'return_value',
            buildCallExpression(
              buildRegularMemberExpression(session, 'serializeParameter'),
              [buildIdentifier(`${session}_SUCCESS`), buildLiteral('return')],
            ),
          ),
          buildRegularProperty(
            'exceptions',
            buildCallExpression(
              buildRegularMemberExpression(session, 'serializeException'),
              [buildIdentifier(`${session}_FAILURE`)],
            ),
          ),
        ]),
      ]),
    );

  const makeFailureStatement = (node, { options: { session } }) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(`${session}_FAILURE`),
        buildIdentifier(`${session}_ERROR`),
      ),
    );

  const makeHeadStatementArray = (node, { options: { session } }, children) =>
    children.length === 0
      ? []
      : [
          buildVariableDeclaration(
            'var',
            children.map((child, index) =>
              buildVariableDeclarator(
                child,
                buildIdentifier(`${session}_ARGUMENT_${String(index)}`),
              ),
            ),
          ),
        ];

  const makeBodyStatementArray = (node, context, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [joinReturnStatement(node, context, child)];

  const joinClosure = (node, context, child1, children, child2) => ({
    type: node.type,
    id: child1,
    expression: false,
    async: node.async,
    generator: node.generator,
    params: node.params.map((child, index) => {
      let pattern = buildIdentifier(
        `${context.options.session}_ARGUMENT_${String(index)}`,
      );
      if (child.type === 'RestElement') {
        pattern = buildRestElement(pattern);
      }
      return pattern;
    }),
    body: buildBlockStatement([
      makeSetupStatement(node, context),
      makeEnterStatement(node, context),
      buildTryStatement(
        buildBlockStatement([
          ...makeHeadStatementArray(node, context, children),
          ...makeBodyStatementArray(node, context, child2),
        ]),
        buildCatchClause(
          buildIdentifier(`${context.options.session}_ERROR`),
          buildBlockStatement([makeFailureStatement(node, context)]),
        ),
        buildBlockStatement([makeLeaveStatement(node, context)]),
      ),
    ]),
  });

  const splitClosure = (node, context) => [
    node.type === 'ArrowFunctionExpression' || node.id === null
      ? getEmptyResult()
      : visit(node.id, context),
    node.params.map((child) =>
      visit(child.type === 'RestElement' ? child.argument : child, context),
    ),
    visit(node.body, context),
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

setVisitor('Literal', getEmptyArray, (node, context) => {
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

setVisitor('TemplateElement', getEmptyArray, (node, context) => ({
  type: 'TemplateElement',
  tail: node.tail,
  value: {
    cooked: node.value.cooked,
    raw: node.value.raw,
  },
}));

setVisitor(
  'TemplateLiteral',
  (node, context) => [
    node.quasis.map((child) => visit(child, context)),
    node.expressions.map((child) => visit(child, context)),
  ],
  (node, context, children1, children2) => ({
    type: 'TemplateLiteral',
    quasis: children1,
    expressions: children2,
  }),
);

setVisitor(
  'TaggedTemplateExpression',
  (node, context) => [visit(node.tag, context), visit(node.quasi, context)],
  (node, context, child1, child2) => ({
    type: 'TaggedTemplateExpression',
    tag: child1,
    quasi: child2,
  }),
);

setVisitor(
  'SpreadElement',
  (node, context) => [visit(node.argument, context)],
  (node, context, child) => ({
    type: 'SpreadElement',
    argument: child,
  }),
);

setVisitor(
  'ArrayExpression',
  (node, context) => [
    node.elements.map((child) =>
      child == null ? getEmptyResult() : visit(child, context),
    ),
  ],
  (node, context, children) => ({
    type: 'ArrayExpression',
    elements: children,
  }),
);

setVisitor(
  'Property',
  (node, context) => [visit(node.key, context), visit(node.value, context)],
  (node, context, child1, child2) => ({
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
  (node, context) => [node.properties.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'ObjectExpression',
    properties: children,
  }),
);

/////////////////
// Environment //
/////////////////

// Identifier cf visit-common-other.mjs

setVisitor('Super', getEmptyArray, (node, context) => ({
  type: 'Super',
}));

setVisitor('ThisExpression', getEmptyArray, (node, context) => ({
  type: 'ThisExpression',
}));

setVisitor(
  'AssignmentExpression',
  (node, context) => [visit(node.left, context), visit(node.right, context)],
  (node, context, child1, child2) => ({
    type: 'AssignmentExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'UpdateExpression',
  (node, context) => [visit(node.argument, context)],
  (node, context, child) => ({
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
  (node, context) => [visit(node.source, context)],
  (node, context, child) => ({
    type: 'ImportExpression',
    source: child,
  }),
);

setVisitor(
  'ChainExpression',
  (node, context) => [visit(node.expression, context)],
  (node, context, child) => ({
    type: 'ChainExpression',
    expression: child,
  }),
);

setVisitor(
  'AwaitExpression',
  (node, context) => [visit(node.argument, context)],
  (node, context, child) => ({
    type: 'AwaitExpression',
    argument: child,
  }),
);

setVisitor(
  'YieldExpression',
  (node, context) => [visit(node.argument, context)],
  (node, context, child) => ({
    type: 'YieldExpression',
    delegate: node.delegate,
    argument: child,
  }),
);

setVisitor(
  'ConditionalExpression',
  (node, context) => [
    visit(node.test, context),
    visit(node.consequent, context),
    visit(node.alternate, context),
  ],
  (node, context, child1, child2, child3) => ({
    type: 'ConditionalExpression',
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  'LogicalExpression',
  (node, context) => [visit(node.left, context), visit(node.right, context)],
  (node, context, child1, child2) => ({
    type: 'LogicalExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'SequenceExpression',
  (node, context) => [node.expressions.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'SequenceExpression',
    expressions: children,
  }),
);

//////////////////
// Comnbination //
//////////////////

setVisitor(
  'MemberExpression',
  (node, context) => [
    visit(node.object, context),
    visit(node.property, context),
  ],
  (node, context, child1, child2) => ({
    type: 'MemberExpression',
    computed: node.computed,
    optional: node.optional,
    object: child1,
    property: child2,
  }),
);

setVisitor(
  'BinaryExpression',
  (node, context) => [visit(node.left, context), visit(node.right, context)],
  (node, context, child1, child2) => ({
    type: 'BinaryExpression',
    operator: node.operator,
    left: child1,
    right: child2,
  }),
);

setVisitor(
  'UnaryExpression',
  (node, context) => [visit(node.argument, context)],
  (node, context, child) => ({
    type: 'UnaryExpression',
    operator: node.operator,
    prefix: node.prefix, // always true
    argument: child,
  }),
);

setVisitor(
  'CallExpression',
  (node, context) => [
    visit(node.callee, context),
    node.arguments.map((child) => visit(child, context)),
  ],
  (node, context, child, children) => ({
    type: 'CallExpression',
    optional: node.optional,
    callee: child,
    arguments: children,
  }),
);

setVisitor(
  'NewExpression',
  (node, context) => [
    visit(node.callee, context),
    node.arguments.map((child) => visit(child, context)),
  ],
  (node, context, child, children) => ({
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

setVisitor(
  'Identifier',
  getEmptyArray,
  (node, { location, options: { session } }) => {
    if (!location.isNonScopingIdentifier()) {
      if (node.name.startsWith(session)) {
        // Would be cleaner to use either because this is not a bug
        throw new Collision(
          `identifier collision detected at ${location
            .getFile()
            .getPath()}@${location.getStartLine()}-${location.getStartColumn()}: ${
            node.name
          } should not start with ${session}`,
        );
      }
    }
    return {
      type: 'Identifier',
      name: node.name,
    };
  },
);

// Identifier cf visit-common-other.mjs

setVisitor(
  'AssignmentPattern',
  (node, context) => [visit(node.left, context), visit(node.right, context)],
  (node, context, child1, chidl2) => ({
    type: 'AssignmentPattern',
    left: child1,
    right: chidl2,
  }),
);

// Property cf visit-common-other.mjs
setVisitor(
  'ObjectPattern',
  (node, context) => [node.properties.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'ObjectPattern',
    properties: children,
  }),
);

setVisitor(
  'ArrayPattern',
  (node, context) => [
    node.elements.map((child) =>
      child === null ? getEmptyResult() : visit(child, context),
    ),
  ],
  (node, context, children) => ({
    type: 'ArrayPattern',
    elements: children,
  }),
);

setVisitor(
  'RestElement',
  (node, context) => [visit(node.argument, context)],
  (ndoe, context, child) => ({
    type: 'RestElement',
    argument: child,
  }),
);

setVisitor(
  'Program',
  (node, context) => [node.body.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'Program',
    sourceType: node.sourceType,
    body: children,
  }),
);

////////////
// Atomic //
////////////

// ReturnStatement cf visit-common-closure.mjs

setVisitor('EmptyStatement', getEmptyArray, (node, context) => ({
  type: 'EmptyStatement',
}));

setVisitor(
  'ThrowStatement',
  (node, context) => [visit(node.argument, context)],
  (node, context, child) => ({
    type: 'ThrowStatement',
    argument: child,
  }),
);

setVisitor(
  'ExpressionStatement',
  (node, context) => [visit(node.expression, context)],
  (node, context, child) => ({
    type: 'ExpressionStatement',
    expression: child,
  }),
);

setVisitor('DebuggerStatement', getEmptyArray, (node, context) => ({
  type: 'DebuggerStatement',
}));

setVisitor(
  'BreakStatement',
  (node, context) => [
    node.label === null ? getEmptyResult() : visit(node.label, context),
  ],
  (node, context, child) => ({
    type: 'BreakStatement',
    label: child,
  }),
);

setVisitor(
  'ContinueStatement',
  (node, context) => [
    node.label === null ? getEmptyResult() : visit(node.label, context),
  ],
  (node, context, child) => ({
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
  (node, context) => [
    visit(node.id, context),
    node.init === null ? getEmptyResult() : visit(node.init, context),
  ],
  (node, context, child1, child2) => ({
    type: 'VariableDeclarator',
    id: child1,
    init: child2,
  }),
);

setVisitor(
  'VariableDeclaration',
  (node, context) => [node.declarations.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'VariableDeclaration',
    kind: node.kind,
    declarations: children,
  }),
);

setVisitor(
  'ImportSpecifier',
  (node, context) => [
    visit(node.local, context),
    visit(node.imported, context),
  ],
  (node, context, child1, child2) => ({
    type: 'ImportSpecifier',
    local: child1,
    imported: child2,
  }),
);

setVisitor(
  'ImportDefaultSpecifier',
  (node, context) => [visit(node.local, context)],
  (node, context, child) => ({
    type: 'ImportDefaultSpecifier',
    local: child,
  }),
);

setVisitor(
  'ImportNamespaceSpecifier',
  (node, context) => [visit(node.local, context)],
  (node, context, child) => ({
    type: 'ImportNamespaceSpecifier',
    local: child,
  }),
);

setVisitor(
  'ImportDeclaration',
  (node, context) => [
    node.specifiers.map((child) => visit(child, context)),
    visit(node.source, context),
  ],
  (node, context, children, child) => ({
    type: 'ImportDeclaration',
    specifiers: children,
    source: child,
  }),
);

setVisitor(
  'ExportSpecifier',
  (node, context) => [
    visit(node.local, context),
    visit(node.exported, context),
  ],
  (node, context, child1, child2) => ({
    type: 'ExportSpecifier',
    local: child1,
    exported: child2,
  }),
);

setVisitor(
  'ExportNamedDeclaration',
  (node, context) => [
    node.declaration === null
      ? getEmptyResult()
      : visit(node.declaration, context),
    node.specifiers.map((child) => visit(child, context)),
    node.source === null ? getEmptyResult() : visit(node.source, context),
  ],
  (node, context, child1, children, child2) => ({
    type: 'ExportNamedDeclaration',
    declaration: child1,
    specifiers: children,
    source: child2,
  }),
);

setVisitor(
  'ExportDefaultDeclaration',
  (node, context) => [visit(node.declaration, context)],
  (node, context, child) => ({
    type: 'ExportDefaultDeclaration',
    declaration: child,
  }),
);

setVisitor(
  'ExportAllDeclaration',
  (node, context) => [visit(node.source, context)],
  (node, context, child) => ({
    type: 'ExportAllDeclaration',
    source: child,
  }),
);

//////////////
// Compound //
//////////////

setVisitor(
  'BlockStatement',
  (node, context) => [node.body.map((child) => visit(child, context))],
  (node, context, children) => ({
    type: 'BlockStatement',
    body: children,
  }),
);

setVisitor(
  'WithStatement',
  (node, context) => [visit(node.object, context), visit(node.body, context)],
  (node, context, child1, child2) => ({
    type: 'WithStatement',
    object: child1,
    body: child2,
  }),
);

setVisitor(
  'LabeledStatement',
  (node, context) => [visit(node.label, context), visit(node.body, context)],
  (node, context, child1, child2) => ({
    type: 'LabeledStatement',
    label: child1,
    body: child2,
  }),
);

setVisitor(
  'IfStatement',
  (node, context) => [
    visit(node.test, context),
    visit(node.consequent, context),
    node.alternate === null ? getEmptyResult() : visit(node.alternate, context),
  ],
  (node, context, child1, child2, child3) => ({
    type: 'IfStatement',
    test: child1,
    consequent: child2,
    alternate: child3,
  }),
);

setVisitor(
  'CatchClause',
  (node, context) => [
    node.param === null ? getEmptyResult() : visit(node.param, context),
    visit(node.body, context),
  ],
  (node, context, child1, child2) => ({
    type: 'CatchClause',
    param: child1,
    body: child2,
  }),
);

setVisitor(
  'TryStatement',
  (node, context) => [
    visit(node.block, context),
    node.handler === null ? getEmptyResult() : visit(node.handler, context),
    node.finalizer === null ? getEmptyResult() : visit(node.finalizer, context),
  ],
  (node, context, child1, child2, child3) => ({
    type: 'TryStatement',
    block: child1,
    handler: child2,
    finalizer: child3,
  }),
);

setVisitor(
  'WhileStatement',
  (node, context) => [visit(node.test, context), visit(node.body, context)],
  (node, context, child1, child2) => ({
    type: 'WhileStatement',
    test: child1,
    body: child2,
  }),
);

setVisitor(
  'DoWhileStatement',
  (node, context) => [visit(node.test, context), visit(node.body, context)],
  (node, context, child1, child2) => ({
    type: 'DoWhileStatement',
    test: child1,
    body: child2,
  }),
);

setVisitor(
  'ForStatement',
  (node, context) => [
    node.init === null ? getEmptyResult() : visit(node.init, context),
    node.test === null ? getEmptyResult() : visit(node.test, context),
    node.update === null ? getEmptyResult() : visit(node.update, context),
    visit(node.body, context),
  ],
  (node, context, child1, child2, child3, child4) => ({
    type: 'ForStatement',
    init: child1,
    test: child2,
    update: child3,
    body: child4,
  }),
);

setVisitor(
  'ForOfStatement',
  (node, context) => [
    visit(node.left, context),
    visit(node.right, context),
    visit(node.body, context),
  ],
  (node, context, child1, child2, child3) => ({
    type: 'ForOfStatement',
    await: node.await,
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  'ForInStatement',
  (node, context) => [
    visit(node.left, context),
    visit(node.right, context),
    visit(node.body, context),
  ],
  (node, context, child1, child2, child3) => ({
    type: 'ForInStatement',
    left: child1,
    right: child2,
    body: child3,
  }),
);

setVisitor(
  'SwitchCase',
  (node, context) => [
    node.test === null ? getEmptyResult() : visit(node.test, context),
    node.consequent.map((child) => visit(child, context)),
  ],
  (node, context, child, children) => ({
    type: 'SwitchCase',
    test: child,
    consequent: children,
  }),
);

setVisitor(
  'SwitchStatement',
  (node, context) => [
    visit(node.discriminant, context),
    node.cases.map((child) => visit(child, context)),
  ],
  (node, context, child, children) => ({
    type: 'SwitchStatement',
    discriminant: child,
    cases: children,
  }),
);

const instrument = (file, options) => {
  try {
    return file.parse().mapRight((node) => {
      const result = visit(node, {
        location: new RootLocation(file),
        options,
      });
      return {
        content: escodegen.generate(getResultNode(result)),
        entities: getResultEntities(result),
      };
    });
  } catch (error) {
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
  ) {
    this.path = path;
    this.version = version;
    this.source = source;
    this.content = content;
  }
  getPath() {
    return this.path;
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
    } catch (error) {
      return new Left(`failed to parse ${this.path} >> ${error.message}`);
    }
  }
}

const VERSION = '1.5.0';

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
        type: 'class',
        name: Path__namespace.basename(path),
        children: entities,
      });
  }
  return {
    content: JSON.stringify({
      version: VERSION,
      metadata: recording.configuration.getMetaData(),
      classMap: roots,
      events: recording.events,
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
  toggle() {
    assert(this.running !== null, 'terminated recording %o', this);
    this.running = !this.running;
    return this.running;
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
  }
  initialize(session) {
    assert(this.session === null, 'already initialized appmap %o', this);
    this.session = session;
    return new Right({
      session: session,
      hooking: this.configuration.getHooking(),
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
    const { enabled, shallow, exclude } = this.configuration.getInstrumentation(
      path,
    );
    if (!enabled) {
      return new Right(content);
    }
    const origin = {
      path,
      entities: null,
    };
    const key = this.origins.push(origin);
    return instrument(
      new File(this.configuration.getLanguageVersion(), source, path, content),
      {
        session: this.session,
        origin: key,
        exclude: new Set(exclude),
        shallow,
      },
    )
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
  toggle(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings.get(key).mapRight((recording) => recording.toggle());
  }
  toggleAsync(key) {
    return Promise.resolve(this.toggle(key));
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
