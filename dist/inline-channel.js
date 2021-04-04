'use strict';

var FileSystem = require('fs');
var Yaml = require('yaml');
var Util = require('util');
var Path = require('path');
var ChildProcess = require('child_process');
var acorn = require('acorn');
var escodegen = require('escodegen');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Yaml__default = /*#__PURE__*/_interopDefaultLegacy(Yaml);

// I'm not about the debuglog api because modifying process.env.NODE_DEBUG has no effect.
// Why not directly provide the optimize logging function then?
// https://github.com/nodejs/node/blob/master/lib/internal/util/debuglog.js

const logger = {
  error: Util.debuglog('appmap-error', (log) => {
    logger.error = log;
  }),
  warning: Util.debuglog('appmap-warning', (log) => {
    logger.warning = log;
  }),
  info: Util.debuglog('appmap-info', (log) => {
    logger.info = log;
  }),
};

const DEFAULT_ENABLED = false;
const DEFAULT_OUTPUT_DIR = 'tmp/appmap';
const DEFAULT_GIT_DIR = '.';
const DEFAULT_LANGUAGE_VERSION = '2015';
const DEFAULT_ESCAPE_PREFIX = 'APPMAP';
const DEFAULT_APP_NAME = 'unknown-app-name';
const DEFAULT_MAP_NAME = 'unknown-map-name';

const wrapName = (name) => ({ name });

const combine = (closure1, closure2) => (any) => closure2(closure1(any));

const isNotNull = (any) => any !== null;

const trim = (string) => string.trim();

const toLowerCase = (string) => string.toLowerCase();

const identity = (any) => any;

const isAppmapEnvKey = (key) => key === 'APPMAP' || key.startsWith('APPMAP_');

//////////////
// Sanitize //
//////////////

const makeEscapePrefixSanitizer = (location) => (string) => {
  if (!/^[a-zA-Z_$][a-zA-Z_$0-9]+$/.test(string)) {
    logger.warning(
      'Invalid %s, defaulting to %s >> expected matching /^[a-zA-Z_$][a-zA-Z_$0-9]+$/ and got: %s',
      location,
      DEFAULT_ESCAPE_PREFIX,
      string,
    );
    return DEFAULT_ESCAPE_PREFIX;
  }
  return string;
};

const ecmas = [
  '5',
  '5.1',
  '2015',
  '2016',
  '2017',
  '2018',
  '2019',
  '2020',
  '2021',
];

const makeLanguageVersionSanitizer = (location) => (string) => {
  if (!ecmas.includes(string)) {
    logger.warning(
      'Invalid %s env argument, defaulting to %s >> expected one of %j and got: %s',
      ecmas,
      DEFAULT_LANGUAGE_VERSION,
      string,
    );
    return DEFAULT_LANGUAGE_VERSION;
  }
  return string;
};

const makeTypeSanitizer = (type, location, json1) => (json2) => {
  /* eslint-disable valid-typeof */
  if (typeof json2 !== type) {
    logger.warning(
      'Invalid %s, defaulting to %j >> expected a %s and got: %j',
      location,
      json1,
      type,
      json2,
    );
    return json1;
  }
  /* eslint-enable valid-typeof */
  return json2;
};

const makeBooleanStringSanitizer = (location, boolean) => (string) => {
  string = string.toLowerCase();
  if (string !== 'true' && string !== 'false') {
    logger.warning(
      "Invalid %s, defaulting to %b >> expected 'true' or 'false' (case insensitive) and got: %s",
      location,
      boolean,
      string,
    );
    return boolean;
  }
  return string === 'true';
};

const makeArraySanitizer = (location, sanitizer) => (json) => {
  if (!Array.isArray(json)) {
    logger.warning(
      'Invalid %s, defaulting to [] >> expected an array and got: %j',
      location,
      json,
    );
    return [];
  }
  return json.map(sanitizer).filter(isNotNull);
};

const mappings = {
  env: {
    __proto__: null,
    APPMAP: {
      name: 'enabled',
      sanitize: combine(
        toLowerCase,
        makeBooleanStringSanitizer('APPMAP env argument', false),
      ),
    },
    APPMAP_MAP_NAME: {
      name: 'map_name',
      sanitize: identity,
    },
    APPMAP_APP_NAME: {
      name: 'app_name',
      sanitize: identity,
    },
    APPMAP_LANGUAGE_VERSION: {
      name: 'language_version',
      sanitize: makeLanguageVersionSanitizer(),
    },
    APPMAP_ESCAPE_PREFIX: {
      name: 'escape_prefix',
      sanitize: makeEscapePrefixSanitizer('APPMAP_ESCAPE_PREFIX env argument'),
    },
    APPMAP_OUTPUT_DIR: {
      name: 'output_dir',
      sanitize: identity,
    },
    APPMAP_GIT_DIR: {
      name: 'git_dir',
      sanitize: identity,
    },
    APPMAP_EXCLUDE: {
      name: 'exclusions',
      sanitize: (string) => string.split(',').map(trim),
    },
    APPMAP_PACKAGES: {
      name: 'packages',
      sanitize: (string) => string.split(',').map(trim).map(wrapName),
    },
  },
  json: {
    __proto__: null,
    enabled: {
      name: 'enabled',
      sanitize: makeTypeSanitizer('boolean', 'enabled value', false),
    },
    name: {
      name: 'app_name',
      sanitize: makeTypeSanitizer('string', 'name value', DEFAULT_APP_NAME),
    },
    'map-name': {
      name: 'map_name',
      sanitize: makeTypeSanitizer('string', 'map-name value', DEFAULT_MAP_NAME),
    },
    'language-version': {
      name: 'language_version',
      sanitize: combine(
        makeTypeSanitizer(
          'string',
          'language-version value',
          DEFAULT_LANGUAGE_VERSION,
        ),
        makeLanguageVersionSanitizer(),
      ),
    },
    'escape-prefix': {
      name: 'escape_prefix',
      sanitize: combine(
        makeTypeSanitizer(
          'string',
          'escape-prefix value',
          DEFAULT_ESCAPE_PREFIX,
        ),
        makeEscapePrefixSanitizer('escape-prefix value'),
      ),
    },
    'output-dir': {
      name: 'output_dir',
      sanitize: makeTypeSanitizer(
        'string',
        'output-dir value',
        DEFAULT_OUTPUT_DIR,
      ),
    },
    'git-dir': {
      name: 'git_dir',
      sanitize: makeTypeSanitizer('string', 'git-dir value', DEFAULT_GIT_DIR),
    },
    packages: {
      name: 'packages',
      sanitize: makeArraySanitizer('output_dir conf value', (json, index) => {
        if (typeof json === 'string') {
          return { name: json };
        }
        if (typeof json === 'object' && json !== null) {
          if (Reflect.getOwnPropertyDescriptor(json, 'name') === undefined) {
            logger.warning(
              'Invalid packages[%i] value >> missing name field and got %s',
              index,
              json,
            );
            return null;
          }
          if (typeof json.name !== 'string') {
            logger.warning(
              'Invalid packages[%i].name value >> expected a string and got %s',
              index,
              json.name,
            );
            return null;
          }
          return {
            name: json.name,
          };
        }
        logger.warning(
          'Invalid packages[%i] value >> expected either a string or an object and got %s',
          index,
          json,
        );
        return null;
      }),
    },
    exclude: {
      name: 'exclusions',
      sanitize: makeArraySanitizer('exclude conf value', (json, index) => {
        if (typeof json !== 'string') {
          logger.warning(
            'Invalid exclude[%i] conf value >> expected a string and got %j',
            index,
            json,
          );
          return null;
        }
        return json;
      }),
    },
  },
};

///////////
// Merge //
///////////

const overwrite = (scalar1, scalar2) => scalar2;

const concat = (array1, array2) => [...array1, ...array2];

const mergers = {
  enabled: overwrite,
  app_name: overwrite,
  map_name: overwrite,
  language_version: overwrite,
  escape_prefix: overwrite,
  output_dir: overwrite,
  git_dir: overwrite,
  packages: concat,
  exclusions: concat,
};

////////////
// Extend //
////////////

const extend = (mapping, conf, object) => {
  conf = { ...conf };
  Reflect.ownKeys(object).forEach((key) => {
    if (key in mapping) {
      const { name, sanitize } = mapping[key];
      conf[name] = mergers[name](conf[name], sanitize(object[key]));
    } else {
      logger.warning('Unrecognized conf key %s', key);
    }
  });
  return conf;
};

const extendWithPath = (conf, path) => {
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml')) {
    parse = Yaml__default['default'].parse;
  } else {
    logger.warning(
      "Invalid conf file extension >> expected '.yml' or '.json', got: %s",
      conf,
    );
    return undefined;
  }
  let content;
  try {
    content = FileSystem.readFileSync(path, 'utf8');
  } catch (error) {
    logger.warning('Failed to read conf file at %s >> %s', path, error.message);
    return undefined;
  }
  let json;
  try {
    json = parse(content);
  } catch (error) {
    logger.warning('Failed to parse conf file >> %s', error.message);
  }
  /* eslint-disable no-use-before-define */
  return extendWithJson(conf, json);
  /* eslint-enable no-use-before-define */
};

const extendWithJson = (conf, json) => {
  if (json === null || typeof json !== 'object') {
    logger.warning(
      'Invalid top-level format >> expected an object and got: %j',
      json,
    );
    return conf;
  }
  if (Reflect.getOwnPropertyDescriptor(json, 'extend') !== undefined) {
    if (typeof json.extend !== 'string') {
      logger.warning(
        'Invalid extend value >> expected a string and got: %j',
        json.extend,
      );
    } else {
      conf = extendWithPath(conf, json.extend);
    }
  }
  return extend(mappings.json, conf, json);
};

const extendWithEnv = (conf, env) => {
  if (Reflect.getOwnPropertyDescriptor(env, 'APPMAP_CONFIG') !== undefined) {
    conf = extendWithPath(conf, env.APPMAP_CONFIG);
  }
  return extend(
    mappings.env,
    conf,
    Reflect.ownKeys(env)
      .filter(isAppmapEnvKey)
      .reduce(
        (acc, key) => {
          acc[key] = env[key];
          return acc;
        },
        { __proto__: null },
      ),
  );
};

////////////
// Config //
////////////

class Config {
  constructor(conf) {
    this.conf = conf;
  }
  extendWithJson(json) {
    return new Config(extendWithJson(this.conf, json));
  }
  extendWithPath(path) {
    return new Config(extendWithPath(this.conf, path));
  }
  extendWithEnv(env) {
    return new Config(extendWithEnv(this.conf, env));
  }
  getEscapePrefix() {
    return this.conf.escape_prefix;
  }
  getOutputDir() {
    return this.conf.output_dir;
  }
  getGitDir() {
    return this.conf.git_dir;
  }
  getAppName() {
    return this.conf.app_name;
  }
  getLanguageVersion() {
    return this.conf.language_version;
  }
  getMapName() {
    return this.conf.map_name;
  }
  isEnabled() {
    return this.conf.enabled;
  }
  getPackages() {
    return this.conf.packages;
  }
  getExclusions() {
    return this.conf.exclusions;
  }
}

const config = new Config({
  enabled: DEFAULT_ENABLED,
  app_name: DEFAULT_APP_NAME,
  map_name: DEFAULT_MAP_NAME,
  git_dir: DEFAULT_GIT_DIR,
  language_version: DEFAULT_LANGUAGE_VERSION,
  escape_prefix: DEFAULT_ESCAPE_PREFIX,
  output_dir: DEFAULT_OUTPUT_DIR,
  packages: [],
  exclusions: [],
});

const getDefaultConfig = () => config;

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
      logger.error(
        `Base-level identifier should never start with %s, got: %`,
        this.prefix,
        identifier,
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
      logger.error('Unrecognized global identifier name, got: %s', name);
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocal(name) {
    if (!(name in locals)) {
      logger.error('Unrecognized local identifier name, got: %s', name);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
});

const trim$1 = (string) => string.trim();

const format = (command, path, reason, detail, stderr) =>
  `Command failure cwd=${path}: ${command} >> ${reason} ${detail} ${stderr}`;

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
    logger.warning(
      format(command, path, 'failed with', result.error.message, result.stderr),
    );
    return null;
  }
  if (result.signal !== null) {
    logger.warning(
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
  /* c8 ignore start */
  if (status === null) {
    return null;
  }
  /* c8 ignore stop */
  return status.split('\n').map(trim$1);
};

const parseDescription = (description) => {
  /* c8 ignore start */
  if (description === null) {
    return null;
  }
  /* c8 ignore stop */
  const parts = /^([^-]*)-([0-9]+)-/.exec(description);
  /* c8 ignore start */
  if (parts === null) {
    logger.warning(`Failed to parse git description, got: ${description}`);
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
  if (result.status !== 0) {
    logger.warning(
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
  /* c8 ignore stop */
  return result.stdout.trim();
};

var git = (path) => {
  if (run(`git rev-parse --git-dir`, path) === null) {
    logger.warning(`Not a git repository`);
    return null;
  }
  return {
    repository: run(`git config --get remote.origin.url`, path),
    branch: run(`git rev-parse --abbrev-ref HEAD`, path),
    commit: run(`git rev-parse HEAD`, path),
    status: parseStatus(run(`git status --porcelain`, path)),
    tag: run(`git describe --abbrev=0 --tags`, path),
    annotated_tag: run(`git describe --abbrev=0`, path),
    commits_since_tag: parseDescription(run(`git describe --long --tag`, path)),
    commits_since_annotated_tag: parseDescription(
      run(`git describe --long`, path),
    ),
  };
};

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
    logger.error(`Invalid node for getKind()`);
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
      logger.warning(
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
    logger.error(`RootLocation.makeEntity()`);
    return null;
  }
  isStaticMethod() {
    logger.error(`RootLocation.isStaticMethod()`);
    return false;
  }
  isChildStaticMethod() {
    logger.error(`RootLocation.isChildStaticMethod()`);
    return false;
  }
  isChildNonScopingIdentifier() {
    logger.error(`RootLocation.isChildScopingIdentifier()`);
    return false;
  }
  isNonScopingIdentifier() {
    logger.error(`RootLocation.isScopingIdentifier()`);
    return false;
  }
  getStartLine() {
    logger.error(`RootLocation.getStartLine()`);
    return 0;
  }
  getName(file) {
    logger.error(`RootLocation.getName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_NAME__';
  }
  getChildName() {
    logger.error(`RootLocation.getChildName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CHILD_NAME__';
  }
  getKind() {
    logger.error(`RootLocation.getKind()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_KIND__';
  }
  getContainerName(file) {
    logger.error(`RootLocation.getContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CONTAINER_NAME__';
  }
  getParentContainerName() {
    logger.error(`RootLocation.getParentContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_PARENT_CONTAINER_NAME__';
  }
}

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
      logger.error(`Cannot visit node, got: ${node.type}`);
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
        buildIdentifier(context.namespace.getGlobal('EMIT')),
        [
          buildObjectExpression([
            buildRegularProperty(
              'id',
              buildIdentifier(context.namespace.getLocal('EVENT_IDENTITY')),
            ),
            buildRegularProperty('event', buildLiteral('call')),
            buildRegularProperty(
              'thread_id',
              buildIdentifier(context.namespace.getGlobal('PID')),
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
        buildIdentifier(context.namespace.getGlobal('EMIT')),
        [
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
              buildIdentifier(context.namespace.getGlobal('PID')),
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

const APPMAP_VERSION = '1.4';

// Getting the right version:
//
// import { home } from '../../home.js';
// npx rollup --plugin commonjs
// const client = JSON.parse(
//   FileSystem.readFileSync(Path.join(home, 'package.json'), 'utf8'),
// );

const client = {
  name: '@appland/appmap-agent-js',
  repository: {
    type: 'git',
    url: 'https://github.com/applandinc/appmap-agent-js.git',
  },
  version: '???',
};

var Appmap = (class Appmap {
  constructor() {
    this.state = null;
  }
  initialize(recorder, config, init) {
    if (this.state !== null) {
      logger.error('Appmap cannot be initialized because it is not idle');
    } else {
      this.state = {
        config: config.extendWithEnv(init.env),
        namespace: new Namespace(config.getEscapePrefix()),
        appmap: {
          version: APPMAP_VERSION,
          metadata: {
            name: config.getMapName(),
            labels: init.labels,
            app: config.getAppName(),
            feature: init.feature,
            feature_group: init.feature_group,
            language: {
              name: 'javascript',
              engine: init.engine,
              version: config.getLanguageVersion(),
            },
            frameworks: init.frameworks,
            client: {
              name: client.name,
              url: client.repository.url,
              version: client.version,
            },
            recorder: {
              name: recorder,
            },
            recording: init.recording,
            git: git(config.getGitDir()),
          },
          classMap: [],
          events: [],
        },
      };
    }
  }
  instrument(source, path, content) {
    if (this.state === null) {
      logger.error('Appmap cannot instrument code because it is idle');
      return content;
    }
    logger.info('Appmap instrument %s at %s', source, path);
    return instrument(
      new File(this.state.config.getLanguageVersion(), source, path, content),
      this.state.namespace,
      (entity) => {
        logger.info('Appmap register code entity: %j', entity);
        this.state.appmap.classMap.push(entity);
      },
    );
  }
  emit(event) {
    if (this.state === null) {
      logger.error(
        'Appmap cannot register event because it is idle; ignoring the event',
      );
    } else {
      logger.info('Appmap save event: %j', event);
      this.state.appmap.events.push(event);
    }
  }
  terminate(reason) {
    if (this.state === null) {
      logger.error('Appmap cannot be terminated because it is idle');
    } else {
      logger.info('Appmap terminate with: %j', reason);
      const path = Path.join(
        this.state.config.getOutputDir(),
        `${this.state.config.getMapName()}.appmap.json`,
      );
      const content = JSON.stringify(this.state.appmap);
      try {
        FileSystem.writeFileSync(path, content, 'utf8');
      } catch (error) {
        logger.error(
          'Appmap cannot be saved at %s because %s; outputing to stdout instead',
          path,
          error.message,
        );
        process.stdout.write(content, 'utf8');
        process.stdout.write('\n', 'utf8');
      } finally {
        this.state = null;
      }
    }
  }
});

const RECORDER_NAME = 'node-inline';

var inlineChannel = (env) => {
  const appmap = new Appmap();
  return {
    initialize: (init) => {
      appmap.initialize(RECORDER_NAME, getDefaultConfig(), init);
    },
    terminate: (reason) => {
      appmap.terminate(reason);
    },
    instrumentScript: (path, content) =>
      appmap.instrument('script', path, content),
    instrumentModule: (path, content, { resolve, reject }) => {
      try {
        resolve(appmap.instrument('module', path, content));
      } catch (error) {
        reject(error);
      }
    },
    emit: (event) => {
      appmap.emit(event);
    },
  };
};

module.exports = inlineChannel;
