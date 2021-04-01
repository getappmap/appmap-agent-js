'use strict';

var Path = require('path');
var Url = require('url');
var FileSystem = require('fs');
var Yaml = require('yaml');
var ChildProcess = require('child_process');
var acorn = require('acorn');
var escodegen = require('escodegen');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Yaml__default = /*#__PURE__*/_interopDefaultLegacy(Yaml);

const DEBUG = 1;
const INFO = 2;
const WARNING = 3;
const ERROR = 4;
const CRITICAL = 5;

let globalLevel = WARNING;

class Logger {
  constructor(
    name,
    level = null,
    writable = process.stderr,
    relative = process.cwd(),
  ) {
    this.name = name.startsWith('file:///')
      ? Path.relative(relative, new Url.URL(name).pathname)
      : name;
    this.level = level;
    this.writable = writable;
  }
  debug(message) {
    if ((this.level === null ? globalLevel : this.level) <= DEBUG) {
      this.writable.write(`DEBUG ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  info(message) {
    if ((this.level === null ? globalLevel : this.level) <= INFO) {
      this.writable.write(`INFO ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  warning(message) {
    if ((this.level === null ? globalLevel : this.level) <= WARNING) {
      this.writable.write(`WARNING ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  error(message) {
    if ((this.level === null ? globalLevel : this.level) <= ERROR) {
      this.writable.write(`ERROR ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  critical(message) {
    if ((this.level === null ? globalLevel : this.level) <= CRITICAL) {
      this.writable.write(`CRITICAL ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  getLevel() {
    return this.level === null ? globalLevel : this.level;
  }
}

const logger = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

const reloadGlobalLevel = (level) => {
  const mapping = {
    __proto__: null,
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL,
  };
  if (level.toUpperCase() in mapping) {
    globalLevel = mapping[level.toUpperCase()];
  } else {
    logger.warning(`Invalid APPMAP_LOG_LEVEL environment variable`);
  }
};

/* c8 ignore start */
if (
  Reflect.getOwnPropertyDescriptor(process.env, 'APPMAP_LOG_LEVEL') !==
  undefined
) {
  reloadGlobalLevel(process.env.APPMAP_LOG_LEVEL);
} else {
  logger.info(`No APPMAP_LOG_LEVEL environment variable provided`);
}
/* c8 ignore end */

const logger$1 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

const isNotNull = (any) => any !== null;

//////////////////////
// enabled (APPMAP) //
//////////////////////

const isEnabled = (env) => {
  if (Reflect.getOwnPropertyDescriptor(env, 'APPMAP') !== undefined) {
    const mapping = {
      __proto__: null,
      TRUE: true,
      FALSE: false,
    };
    if (env.APPMAP.toUpperCase() in mapping) {
      return mapping[env.APPMAP.toUpperCase()];
    }
    logger$1.warning(`Invalid APPMAP environment variable, defaulting to FALSE.`);
    return false;
  }
  logger$1.info(`No APPMAP environment variable provided, defaulting to FALSE.`);
  return false;
};

////////////
// output //
////////////

const getOutputDir = (env) => {
  if (
    Reflect.getOwnPropertyDescriptor(env, 'APPMAP_OUTPUT_DIR') !== undefined
  ) {
    return env.APPMAP_OUTPUT_DIR;
  }
  logger$1.info(
    `No APPMAP_OUTPUT_DIR environment variable provided, defaulting to tmp/appmap.`,
  );
  return 'tmp/appmap/';
};

////////////
// Prefix //
////////////

const getEscapePrefix = (env) => {
  if (
    Reflect.getOwnPropertyDescriptor(env, 'APPMAP_ESCAPE_PREFIX') !== undefined
  ) {
    return env.APPMAP_ESCAPE_PREFIX;
  }
  logger$1.info(
    `No APPMAP_ESCAPE_PREFIX environment variable provided, defaulting to APPMAP.`,
  );
  return 'APPMAP';
};

////////////////////////////
// config (APPMAP_CONFIG) //
////////////////////////////

const defaultConfig = {
  name: 'unknown',
  packages: [],
  exclude: [],
};

const loadYAMLConfig = (env) => {
  let configPath = 'appmap.yml';
  if (Reflect.getOwnPropertyDescriptor(env, 'APPMAP_CONFIG') !== undefined) {
    configPath = env.APPMAP_CONFIG;
  } else {
    logger$1.info(
      `No APPMAP_CONFIG environment variable provided, defaulting to appmap.yml`,
    );
  }

  let configContent = null;
  try {
    configContent = FileSystem.readFileSync(configPath, 'utf8');
  } catch (error) {
    logger$1.warning(`Could not open configuration file: ${error.message}`);
    return { ...defaultConfig };
  }

  try {
    return Yaml__default['default'].parse(configContent);
  } catch (error) {
    logger$1.warning(`Could not parse configuration file: ${error.message}`);
    return { ...defaultConfig };
  }
};

const validatePackage = (package1, index1) => {
  if (typeof package1 !== 'object' || package1 === null) {
    logger$1.warning(
      `Invalid config.packages[${String(
        index1,
      )}] field in configuration file, expected a proper object.`,
    );
    return null;
  }
  if (Reflect.getOwnPropertyDescriptor(package1, 'path') === undefined) {
    logger$1.warning(
      `Missing config.packages[${String(
        index1,
      )}].path field in configuration file.`,
    );
    return null;
  }
  if (typeof package1.path !== 'string') {
    logger$1.warning(
      `Invalid config.packages[${String(index1)}].path, expected a string.`,
    );
    return null;
  }
  // {
  //   const index2 = array.findIndex((package2) =>
  //     typeof package2 === 'object' && package2 !== null
  //       ? package1.path === package2.path
  //       : false,
  //   );
  //   if (index1 !== index2) {
  //     logger.warning(
  //       `Duplicate config.packages[${String(index1)},${String(index2)}].path.`,
  //     );
  //     return null;
  //   }
  // }
  if (Reflect.getOwnPropertyDescriptor(package1, 'shallow') === undefined) {
    logger$1.info(`Missing config.packages[${String(index1)}].shallow.`);
    return {
      path: package1.path,
      shallow: false,
    };
  }
  if (typeof package1.shallow !== 'boolean') {
    logger$1.warning(
      `Invalid config.packages[${String(index1)}].shallow, expected a boolean.`,
    );
    return {
      path: package1.path,
      shallow: false,
    };
  }
  return {
    path: package1.path,
    shallow: package1.shallow,
  };
};

const validateExclude = (exclude, index) => {
  if (typeof exclude !== 'string') {
    logger$1.warning(
      `Invalid config.exclude[${String(
        index,
      )}] field in configuration file, expected a string.`,
    );
    return null;
  }
  return exclude;
};

const validateString = (config, name) => {
  if (Reflect.getOwnPropertyDescriptor(config, name) === undefined) {
    logger$1.warning(`Missing config.${name} field in configuration file.`);
    return defaultConfig[name];
  }
  if (typeof config[name] !== 'string') {
    logger$1.warning(
      `Invalid config.${name} field in configuration file, expected a string.`,
    );
    return defaultConfig[name];
  }
  return config[name];
};

const validateArray = (config, name, validator) => {
  if (Reflect.getOwnPropertyDescriptor(config, name) === undefined) {
    logger$1.info(`Missing config.${name} field in configuration file.`);
    return defaultConfig[name];
  }
  if (!Array.isArray(config[name])) {
    logger$1.warning(
      `Invalid config.${name} field in configuration file, expected an array.`,
    );
    return defaultConfig[name];
  }
  return config[name].map(validator).filter(isNotNull);
};

const validateConfig = (config) => {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    logger$1.warning(`Expected configuration file to return an object.`);
    return { ...defaultConfig };
  }
  return {
    name: validateString(config, 'name'),
    packages: validateArray(config, 'packages', validatePackage),
    exclude: validateArray(config, 'exclude', validateExclude),
  };
};

////////////
// Export //
////////////

class Setting {
  constructor(env) {
    // console.log("foo", loadYAMLConfig(env));
    this.prefix = getEscapePrefix(env);
    this.config = validateConfig(loadYAMLConfig(env));
    this.enabled = isEnabled(env);
    this.outputDir = getOutputDir(env);
  }
  getOutputDir() {
    return this.outputDir;
  }
  getAppName() {
    return this.config.name;
  }
  getEscapePrefix() {
    return this.prefix;
  }
  getInstrumentationDepth(path) {
    if (!this.enabled) {
      return 0;
    }
    const package1 = this.config.packages.find(
      (package2) => package2.path === path,
    );
    if (package1 === undefined) {
      return 0;
    }
    return package1.shallow ? 1 : Infinity;
  }
  isExcluded(path, name) {
    // TODO support for per-package exclusion
    return this.config.exclude.includes(name);
  }
}

const logger$2 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

const trim = (string) => string.trim();

const format = (command, path, reason, detail, stderr) =>
  `Command failure cwd=${path}: ${command} >> ${reason} ${detail}${
    stderr === '' ? '' : `${'\n'}${stderr}`
  }`;

const spawnSync = (command, path) => {
  const result = ChildProcess.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    {
      cwd: path,
      encoding: 'utf8',
      timeout: 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  /* c8 ignore start */
  if (Reflect.getOwnPropertyDescriptor(result, 'error') !== undefined) {
    logger$2.warning(
      format(command, path, 'failed with', result.error.message, result.stderr),
    );
    return null;
  }
  if (result.signal !== null) {
    logger$2.warning(
      format(
        command,
        path,
        'killed with',
        String(result.signal),
        result.stderr,
      ),
    );
    return null;
  }
  /* c8 ignore stop */
  return result;
};

const parseStatus = (status) => {
  if (status === null) {
    return null;
  }
  return status.split('\n').map(trim);
};

const parseDescription = (description) => {
  if (description === null) {
    return null;
  }
  const parts = /^([^-]*)-([0-9]+)-/.exec(description);
  /* c8 ignore start */
  if (parts === null) {
    logger$2.warning(`Failed to parse git description, got: ${description}`);
    return null;
  }
  /* c8 ignore stop */
  return parseInt(parts[2], 10);
};

const run = (command, path) => {
  const result = spawnSync(command, path);
  /* c8 ignore start */
  if (result === null) {
    return null;
  }
  /* c8 ignore stop */
  if (result.status !== 0) {
    logger$2.warning(
      format(
        command,
        path,
        'exit with status',
        String(result.status),
        result.stderr,
      ),
    );
    return null;
  }
  return result.stdout.trim();
};

var git = (path) => {
  const result = spawnSync(`git rev-parse --git-dir`, undefined.path);
  if (result === null || result.status !== 0) {
    logger$2.warning(`Not a git repository`);
    return null;
  }
  return {
    repository: run(`git config --get remote.origin.url`, undefined.path),
    branch: run(`git rev-parse --abbrev-ref HEAD`, undefined.path),
    commit: run(`git rev-parse HEAD`, undefined.path),
    status: parseStatus(run(`git status --porcelain`, undefined.path)),
    tag: run(`git describe --abbrev=0 --tags`, undefined.path),
    annotated_tag: run(`git describe --abbrev=0`, undefined.path),
    commits_since_tag: parseDescription(
      run(`git describe --long --tag`, undefined.path),
    ),
    commits_since_annotated_tag: parseDescription(
      run(`git describe --long`, undefined.path),
    ),
  };
};

const logger$3 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

const globals = {
  __proto__: null,
  UNDEFINED: null,
  EVENT_COUNTER: null,
  EMPTY_MARKER: null,
  GET_NOW: null,
  PROCESS_ID: null,
  SERIALIZE: null,
  SERIALIZE_PARAMETER: null,
  SERIALIZE_EXCEPTION: null,
  GET_CLASS_NAME: null,
  EMIT: null,
  GET_IDENTITY: null,
};

const locals = {
  __proto__: null,
  EVENT_IDENTITY: null,
  ARGUMENT: null,
  ERROR: null,
  SUCCESS: null,
  FAILURE: null,
  TIMER: null,
};

var Namespace = (class Namespace {
  constructor(prefix) {
    this.prefix = prefix;
  }
  checkCollision(identifier) {
    if (identifier.startsWith(this.prefix)) {
      logger$3.error(
        `Base-level identifier should never start with ${this.prefix}, got: ${identifier}`,
      );
    }
  }
  // compileGlobal(identifier) {
  //   if (!identifier.startsWith('APPMAP_GLOBAL_')) {
  //     logger.error(
  //       `Global appmap identifiers should start with "APPMAP_GLOBAL_", got: ${identifier}`,
  //     );
  //     return identifier;
  //   }
  //   const name = identifier.substring('APPMAP_GLOBAL_'.length);
  //   if (!(name in globals)) {
  //     logger.error(
  //       `compileGlobal >> Unrecognized global appmap name, got: ${identifier}`,
  //     );
  //   }
  //   return `${this.prefix}_GLOBAL_${name}`;
  // }
  getGlobal(name) {
    if (!(name in globals)) {
      logger$3.error(
        `getGlobal >> Unrecognized global appmap name, got: ${name}`,
      );
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocal(name) {
    if (!(name in locals)) {
      logger$3.error(`getLocal >> Unrecognized local appmap name, got: ${name}`);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
});

const logger$4 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

const APPMAP_VERSION = '1.4';

const client = FileSystem.readFileSync(
  Path.join(
    Path.dirname(new Url.URL((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href))).pathname),
    '..',
    '..',
    'package.json',
  ),
  'utf8',
);

var Appmap = (class AppMap {
  constructor(metadata, namespace) {
    this.namespace = namespace;
    this.archived = false;
    this.entities = [];
    this.events = [];
    this.metadata = {
      name: '???',
      labels: [],
      app: '???',
      feature: '???',
      feature_group: '???',
      language: {
        name: 'javascript',
        version: '???',
        engine: '???',
      },
      frameworks: [],
      client: {
        name: client.name,
        url: client.url,
        version: client.version,
      },
      recorder: {
        name: '???',
      },
      recording: null,
      git: null,
      ...metadata,
    };
  }
  getLanguageVersion() {
    return this.metadata.language.version;
  }
  getNamespace() {
    return this.namespace;
  }
  addEntity(entity) {
    if (this.archived) {
      logger$4.error(
        `Trying to add a code entity on an archived appmap, got: ${JSON.stringify(
          entity,
        )}`,
      );
    } else {
      this.entities.push(entity);
    }
  }
  addEvent(event) {
    if (this.archived) {
      logger$4.error(
        `Trying to add an event on an archived appmap, got: ${JSON.stringify(
          event,
        )}`,
      );
    } else {
      this.events.push(event);
    }
  }
  archive(dirname, termination) {
    logger$4.info(`Termination: ${JSON.stringify(termination)}`);
    if (this.archived) {
      logger$4.error(
        `Trying to archive an already archived appmap, got: ${JSON.stringify(
          termination,
        )}`,
      );
    } else {
      this.archived = true;
      FileSystem.writeFileSync(
        Path.join(dirname, `${this.metadata.name}.appmap.json`),
        JSON.stringify(
          {
            version: APPMAP_VERSION,
            metadata: this.metadata,
            classMap: this.entities,
            events: this.events,
          },
          null,
          2,
        ),
        'utf8',
      );
    }
  }
});

class File {
  constructor(
    version,
    source,
    path,
    content = FileSystem.readFileSync(path, 'utf8'),
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
    return acorn.parse(this.content, {
      ecmaVersion: this.version,
      sourceType: this.source,
      locations: true,
    });
  }
}

const logger$5 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

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
  constructor(node, location) {
    this.node = node;
    this.parent = location;
  }
  extend(node) {
    return new Location(node, this);
  }
  getKind() {
    if (this.node.type === 'VariableDeclaration') {
      return this.node.kind;
    }
    logger$5.error(`Invalid node for getKind()`);
    return '__APPMAP_AGENT_ERROR_LOCATION_GET_KIND__';
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
  getName(file) {
    if (this.node.type === 'Program') {
      return file.getPath();
    }
    if (this.node.type === 'FunctionDeclaration') {
      return `${getPatternName(this.node.id)}|function`;
    }
    if (this.node.type === 'ClassDeclaration') {
      return `${getPatternName(this.node.id)}|class`;
    }
    if (this.node.type === 'ClassBody') {
      return this.parent.getName(file);
    }
    return this.parent.getChildName(this.node);
  }
  getParentContainerName(file) {
    return this.parent.getContainerName(file);
  }
  getContainerName(file) {
    if (
      this.node.type === 'Program' ||
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration' ||
      this.node.type === 'ArrowFunctionExpression'
    ) {
      return this.getName(file);
    }
    return this.parent.getContainerName(file);
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
  shouldBeInstrumented(file) {
    // TODO add some logic here
    return true;
  }
  isChildNonScopingIdentifier(node) {
    if (node.type !== 'Identifier') {
      logger$5.warning(
        `isChildScopingIdentifier should only be called on Identifier node, got: ${node.type}`,
      );
      return false;
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
  makeEntity(childeren, file) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      return {
        type: 'class',
        name: this.getName(file),
        childeren: [
          {
            type: 'function',
            name: '()',
            source: file.getContent().substring(this.node.start, this.node.end),
            location: `${file.getPath()}:${this.node.loc.start.line}`,
            labels: [],
            comment: null,
            static: this.isStaticMethod(),
          },
        ].concat(childeren),
      };
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassBody'
    ) {
      return {
        type: 'class',
        name: this.getName(file),
        childeren,
      };
    }
    if (this.node.type === 'Program') {
      return {
        type: 'package',
        name: this.getName(file),
        childeren,
      };
    }
    return null;
  }
}

class RootLocation {
  extend(node) {
    return new Location(node, this);
  }
  shouldBeInstrumented() {
    return true;
  }
  makeEntity(childeren, file) {
    logger$5.error(`RootLocation.makeEntity()`);
    return null;
  }
  isStaticMethod() {
    logger$5.error(`RootLocation.isStaticMethod()`);
    return false;
  }
  isChildStaticMethod() {
    logger$5.error(`RootLocation.isChildStaticMethod()`);
    return false;
  }
  isChildNonScopingIdentifier() {
    logger$5.error(`RootLocation.isChildScopingIdentifier()`);
    return false;
  }
  isNonScopingIdentifier() {
    logger$5.error(`RootLocation.isScopingIdentifier()`);
    return false;
  }
  getStartLine() {
    logger$5.error(`RootLocation.getStartLine()`);
    return 0;
  }
  getName(file) {
    logger$5.error(`RootLocation.getName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_NAME__';
  }
  getChildName() {
    logger$5.error(`RootLocation.getChildName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CHILD_NAME__';
  }
  getKind() {
    logger$5.error(`RootLocation.getKind()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_KIND__';
  }
  getContainerName(file) {
    logger$5.error(`RootLocation.getContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CONTAINER_NAME__';
  }
  getParentContainerName() {
    logger$5.error(`RootLocation.getParentContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_PARENT_CONTAINER_NAME__';
  }
}

const logger$6 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

const visitors = { __proto__: null };

const setVisitor = (type, split, join) => {
  visitors[type] = { split, join };
};

const emptyArray = [];

const getEmptyArray = () => emptyArray;

const emptyResult = {
  node: null,
  entities: emptyArray,
};

const getEmptyResult = () => emptyResult;

const getResultEntities = ({ entities }) => entities;

const getResultNode = ({ node }) => node;

const visit = (target, { location, namespace, file }) => {
  let node = target; // eslint no-param-reassign
  let entities = [];
  const extended = location.extend(node);
  if (extended.shouldBeInstrumented(file)) {
    if (node.type in visitors) {
      const context = {
        location: extended,
        file,
        namespace,
      };
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
    } else {
      logger$6.error(`Cannot visit node, got: ${node.type}`);
    }
    const entity = extended.makeEntity(entities, file);
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
  (node, context, childeren) => ({
    type: 'ClassBody',
    body: childeren,
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

/////////////////////
// ReturnStatement //
/////////////////////

const joinReturnStatement = (node, context, child) => ({
  type: 'ReturnStatement',
  argument: buildAssignmentExpression(
    '=',
    buildIdentifier(context.namespace.getLocal('SUCCESS')),
    child === null
      ? buildIdentifier(context.namespace.getGlobal('UNDEFINED'))
      : child,
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
  const makeSetupStatement = (node, context) =>
    buildVariableDeclaration('var', [
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('TIMER')),
        buildCallExpression(
          buildIdentifier(context.namespace.getGlobal('GET_NOW')),
          [],
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('EVENT_IDENTITY')),
        buildAssignmentExpression(
          '+=',
          buildIdentifier(context.namespace.getGlobal('EVENT_COUNTER')),
          buildLiteral(1),
        ),
      ),
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('SUCCESS')),
        buildIdentifier(context.namespace.getGlobal('EMPTY_MARKER')),
      ),
      buildVariableDeclarator(
        buildIdentifier(context.namespace.getLocal('FAILURE')),
        buildIdentifier(context.namespace.getGlobal('EMPTY_MARKER')),
      ),
    ]);

  const makeEnterStatement = (node, context) =>
    buildExpressionStatement(
      buildCallExpression(
        buildIdentifier(context.namespace.getGlobal('SEND')),
        [
          buildLiteral('event'),
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildIdentifier(context.namespace.getLocal('EVENT_IDENTITY')),
            ),
            buildRegularProperty('event', buildLiteral('call')),
            buildRegularProperty(
              'thread_id',
              buildIdentifier(context.namespace.getGlobal('PROCESS_ID')),
            ),
            buildRegularProperty(
              'defined_class',
              buildLiteral(
                context.location.getParentContainerName(context.file),
              ),
            ),
            buildRegularProperty(
              'method_id',
              buildLiteral(context.location.getName(context.file)),
            ),
            buildRegularProperty('path', buildLiteral(context.file.getPath())),
            buildRegularProperty(
              'lineno',
              buildLiteral(context.location.getStartLine()),
            ),
            buildRegularProperty(
              'receiver',
              buildCallExpression(
                buildIdentifier(
                  context.namespace.getGlobal('SERIALIZE_PARAMETER'),
                ),
                [
                  node.type === 'ArrowFunctionExpression'
                    ? buildIdentifier(
                        context.namespace.getGlobal('EMPTY_MARKER'),
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
                    buildIdentifier(
                      context.namespace.getGlobal('SERIALIZE_PARAMETER'),
                    ),
                    [
                      buildIdentifier(
                        `${context.namespace.getLocal('ARGUMENT')}_${String(
                          index,
                        )}`,
                      ),
                      buildLiteral(
                        context.file
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
              buildLiteral(context.location.isStaticMethod()),
            ),
          ]),
        ],
      ),
    );

  const makeLeaveStatement = (node, context) =>
    buildExpressionStatement(
      buildCallExpression(
        buildIdentifier(context.namespace.getGlobal('SEND')),
        [
          buildLiteral('event'),
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildAssignmentExpression(
                '+=',
                buildIdentifier(context.namespace.getGlobal('EVENT_COUNTER')),
                buildLiteral(1),
              ),
            ),
            buildRegularProperty('event', buildLiteral('return')),
            buildRegularProperty(
              'thread_id',
              buildIdentifier(context.namespace.getGlobal('PROCESS_ID')),
            ),
            buildRegularProperty(
              'parent_id',
              buildIdentifier(context.namespace.getLocal('EVENT_IDENTITY')),
            ),
            buildRegularProperty(
              'ellapsed',
              buildBinaryExpression(
                '-',
                buildCallExpression(
                  buildIdentifier(context.namespace.getGlobal('GET_NOW')),
                  [],
                ),
                buildIdentifier(context.namespace.getLocal('TIMER')),
              ),
            ),
            buildRegularProperty(
              'return_value',
              buildCallExpression(
                buildIdentifier(
                  context.namespace.getGlobal('SERIALIZE_PARAMETER'),
                ),
                [
                  buildIdentifier(context.namespace.getLocal('SUCCESS')),
                  buildLiteral('return'),
                ],
              ),
            ),
            buildRegularProperty(
              'exceptions',
              buildCallExpression(
                buildIdentifier(
                  context.namespace.getGlobal('SERIALIZE_EXCEPTION'),
                ),
                [buildIdentifier(context.namespace.getLocal('FAILURE'))],
              ),
            ),
          ]),
        ],
      ),
    );

  const makeFailureStatement = (node, context) =>
    buildThrowStatement(
      buildAssignmentExpression(
        '=',
        buildIdentifier(context.namespace.getLocal('FAILURE')),
        buildIdentifier(context.namespace.getLocal('ERROR')),
      ),
    );

  const makeHeadStatementArray = (node, context, childeren) =>
    childeren.length === 0
      ? []
      : [
          buildVariableDeclaration(
            'var',
            childeren.map((child, index) =>
              buildVariableDeclarator(
                child,
                buildIdentifier(
                  `${context.namespace.getLocal('ARGUMENT')}_${String(index)}`,
                ),
              ),
            ),
          ),
        ];

  const makeBodyStatementArray = (node, context, child) =>
    child.type === 'BlockStatement'
      ? child.body
      : [joinReturnStatement(node, context, child)];

  const joinClosure = (node, context, child1, childeren, child2) => ({
    type: node.type,
    id: child1,
    expression: false,
    async: node.async,
    generator: node.generator,
    params: node.params.map((child, index) => {
      let pattern = buildIdentifier(
        `${context.namespace.getLocal('ARGUMENT')}_${String(index)}`,
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
          ...makeHeadStatementArray(node, context, childeren),
          ...makeBodyStatementArray(node, context, child2),
        ]),
        buildCatchClause(
          buildIdentifier(context.namespace.getLocal('ERROR')),
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
  (node, context, childeren1, childeren2) => ({
    type: 'TemplateLiteral',
    quasis: childeren1,
    expressions: childeren2,
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
  (node, context, childeren) => ({
    type: 'ArrayExpression',
    elements: childeren,
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
  (node, context, childeren) => ({
    type: 'ObjectExpression',
    properties: childeren,
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
  (node, context, childeren) => ({
    type: 'SequenceExpression',
    expressions: childeren,
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
  (node, context, child, childeren) => ({
    type: 'CallExpression',
    optional: node.optional,
    callee: child,
    arguments: childeren,
  }),
);

setVisitor(
  'NewExpression',
  (node, context) => [
    visit(node.callee, context),
    node.arguments.map((child) => visit(child, context)),
  ],
  (node, context, child, childeren) => ({
    type: 'NewExpression',
    callee: child,
    arguments: childeren,
  }),
);

setVisitor('Identifier', getEmptyArray, (node, context) => {
  if (!context.location.isNonScopingIdentifier()) {
    context.namespace.checkCollision(node.name);
  }
  return {
    type: 'Identifier',
    name: node.name,
  };
});

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
  (node, context, childeren) => ({
    type: 'ObjectPattern',
    properties: childeren,
  }),
);

setVisitor(
  'ArrayPattern',
  (node, context) => [
    node.elements.map((child) =>
      child === null ? getEmptyResult() : visit(child, context),
    ),
  ],
  (node, context, childeren) => ({
    type: 'ArrayPattern',
    elements: childeren,
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
  (node, context, childeren) => ({
    type: 'Program',
    sourceType: node.sourceType,
    body: childeren,
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
  (node, context, childeren) => ({
    type: 'VariableDeclaration',
    kind: node.kind,
    declarations: childeren,
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
  (node, context, childeren, child) => ({
    type: 'ImportDeclaration',
    specifiers: childeren,
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
  (node, context, child1, childeren, child2) => ({
    type: 'ExportNamedDeclaration',
    declaration: child1,
    specifiers: childeren,
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
  (node, context, childeren) => ({
    type: 'BlockStatement',
    body: childeren,
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
  (node, context, child, childeren) => ({
    type: 'SwitchCase',
    test: child,
    consequent: childeren,
  }),
);

setVisitor(
  'SwitchStatement',
  (node, context) => [
    visit(node.discriminant, context),
    node.cases.map((child) => visit(child, context)),
  ],
  (node, context, child, childeren) => ({
    type: 'SwitchStatement',
    discriminant: child,
    cases: childeren,
  }),
);

var instrument = (file, namespace, callback) => {
  const location = new RootLocation();
  /* c8 ignore start */
  if (!location.shouldBeInstrumented(file)) {
    return file.content;
  }
  /* c8 ignore stop */
  const result = visit(file.parse(), { location, file, namespace });
  getResultEntities(result).forEach(callback);
  return escodegen.generate(getResultNode(result));
};

const logger$7 = new Logger((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('inline.js', document.baseURI).href)));

var inline = (env) => {
  const config = new Setting(env);
  let appmap = null;
  const addEntity = (entity) => appmap.addEntity(entity);
  return {
    initialize: (data) => {
      if (appmap === null) {
        appmap = new Appmap(
          {
            name: data.name,
            labels: [],
            app: config.getAppName(),
            feature: null,
            feature_group: null,
            language: {
              name: 'javascript',
              engine: data.engine,
              version: data.ecmascript,
            },
            frameworks: [],
            recorder: 'inline',
            recording: null,
            git: git(config.getGitDirectory()),
          },
          new Namespace(data.prefix),
        );
      } else {
        logger$7.error(`duplicate initalization`);
      }
    },
    terminate: (reason) => {
      if (appmap === null) {
        logger$7.error(`terminate before initalization`);
      } else {
        appmap.archive(config.getOutputDir(), reason);
      }
    },
    instrumentScript: (content, path) => {
      if (appmap === null) {
        logger$7.error(`instrumentScript before initalization`);
        return content;
      }
      return instrument(
        new File(appmap.getLanguageVersion(), 'script', path, content),
        appmap.getNamespace(),
        addEntity,
      );
    },
    instrumentModule: (content, path, pending) => {
      if (appmap === null) {
        logger$7.error(`instrumentModule before initalization`);
        pending.resolve(content);
      } else {
        pending.resolve(
          new File(appmap.getLanguageVersion(), 'script', path, content),
          appmap.getNamespace(),
          addEntity,
        );
      }
    },
    emit: (event) => {
      if (appmap === null) {
        logger$7.error(`emit before initalization`);
      } else {
        appmap.addEvent(event);
      }
    },
  };
};

module.exports = inline;
