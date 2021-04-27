'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Util = require('util');
var FileSystem = require('fs');
var Path = require('path');
var YAML = require('yaml');
var Ajv = require('ajv');
var ChildProcess = require('child_process');
var acorn = require('acorn');
var escodegen = require('escodegen');

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
var ChildProcess__namespace = /*#__PURE__*/_interopNamespace(ChildProcess);

// I'm not about the debuglog api because modifying process.env.NODE_DEBUG has no effect.
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
};

// This file must be placed at lib/home.js because it also bundled into dist/inline.js and __dirname is not modified.



var home_1 = Path__default['default'].resolve(__dirname, "..");

const ajv = new Ajv__default['default']();
ajv.addSchema(
  YAML__default['default'].parse(
    FileSystem__namespace.readFileSync(Path__namespace.resolve(home_1, 'src', 'schema.yml'), 'utf8'),
  ),
);
const validateRequestSchema = ajv.getSchema('request');
const validateConfigurationSchema = ajv.getSchema('configuration');
ajv.getSchema('options');

const makeValidate = (name, callback) => (json) => {
  if (!callback(json)) {
    logger.warning(`Invalid json for schema %s: %j`, name, callback.errors);
    // console.asset(validateConfiguration.errors.length > 0)
    const error = callback.errors[0];
    throw new Error(
      `invalid ${name} at ${error.schemaPath}, it ${
        error.message
      } (${JSON.stringify(error.params)})`,
    );
  }
};

const validateRequest = makeValidate('request', validateRequestSchema);

const validateConfiguration = makeValidate(
  'configuration',
  validateConfigurationSchema,
);

const trim$1 = (string) => string.trim();

const format = (command, path, reason, detail, stderr) =>
  `Command failure cwd=${path}: ${command} >> ${reason} ${detail} ${stderr}`;

const spawnSync = (command, path) => {
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

const trim = (string) => string.trim();

const identity = (any) => any;

const flip = (callback) => (arg0, arg1) => callback(arg1, arg0);

const resolve = (base, path) => {
  if (Path__namespace.isAbsolute(path)) {
    return path;
  }
  if (base === null) {
    throw new Error(
      `Missing base directory path to resolve relative path: ${path}`,
    );
  }
  return Path__namespace.resolve(base, path);
};

////////////
// Client //
////////////

const npm = JSON.parse(
  FileSystem__namespace.readFileSync(resolve(home_1, './package.json'), 'utf8'),
);

////////////////////
// extendWithData //
////////////////////

const makeOverwrite = (key, transform) => (value, object, context) => {
  object[key] = transform(value, context);
  return object;
};

const makeConcat = (key) => (value, object, context) => {
  object[key] = [...object[key], ...value];
  return object;
};

const sortPackage = (specifier1, specifier2) =>
  specifier2.path.length - specifier1.path.length;

const mergers = {
  __proto__: null,
  extends: (path, data, base) => {
    /* eslint-disable no-use-before-define */
    return extendWithFile(data, resolve(base, path));
  },
  /* eslint-enable no-use-before-define */
  packages: (specifiers, data, base) => {
    data.packages = [
      ...specifiers.flatMap((specifier) => {
        if (typeof specifier === 'string') {
          specifier = { path: specifier, dist: specifier };
        }
        specifier = {
          shallow: false,
          path: null,
          dist: null,
          exclude: [],
          ...specifier,
        };
        const specifiers = [];
        if (specifier.dist !== null) {
          specifiers.push({
            ...specifier,
            path: resolve(base, Path__namespace.join('node_modules', specifier.dist)),
          });
        }
        if (specifier.path !== null) {
          specifiers.push({
            ...specifier,
            path: resolve(base, specifier.path),
          });
        }
        return specifiers;
      }),
      ...data.packages,
    ];
    data.packages.sort(sortPackage);
    return data;
  },
  exclude: makeConcat('exclude'),
  enabled: makeOverwrite('enabled', identity),
  name: makeOverwrite('map-name', identity),
  'app-name': makeOverwrite('app-name', identity),
  'map-name': makeOverwrite('map-name', identity),
  'language-version': makeOverwrite('language-version', identity),
  'language-engine': makeOverwrite('language-engine', identity),
  'escape-prefix': makeOverwrite('escape-prefix', identity),
  'output-dir': makeOverwrite('output-dir', flip(resolve)),
  'git-dir': makeOverwrite('git-dir', flip(resolve)),
  labels: makeConcat('labels'),
  frameworks: makeConcat('frameworks'),
  feature: makeOverwrite('feature', identity),
  'feature-group': makeOverwrite('feature-group', identity),
  'recorder-name': makeOverwrite('recorder-name', identity),
  'recording-defined-class': makeOverwrite('recording-defined-class', identity),
  'recording-method-id': makeOverwrite('recording-method-id', identity),
};

const extendWithData = (data1, data2, base) => {
  data1 = { ...data1 };
  logger.info('Configuration extended with data: %j', data2);
  if (base !== null) {
    base = resolve(process.cwd(), base);
  }
  Reflect.ownKeys(data2).forEach((key) => {
    data1 = mergers[key](data2[key], data1, base);
  });
  return data1;
};

///////////////////
// extendWithEnv //
///////////////////

const mapping = {
  __proto__: null,
  APPMAP: ['enabled', (string) => string.toLowerCase() === 'true'],
  APPMAP_RC_FILE: ['extends', identity],
  APPMAP_APP_NAME: ['app-name', identity],
  APPMAP_MAP_NAME: ['map-name', identity],
  APPMAP_OUTPUT_DIR: ['output-dir', identity],
  APPMAP_GIT_DIR: ['git-dir', identity],
  APPMAP_LANGUAGE_VERSION: ['language-version', identity],
  APPMAP_PACKAGES: ['packages', (string) => string.split(',').map(trim)],
};

const extendWithEnv = (data1, env, base) => {
  logger.info('Configuration extended with environment: %j', env);
  env = { __proto__: null, ...env };
  const data2 = { __proto__: null };
  Reflect.ownKeys(env).forEach((key1) => {
    if (key1.startsWith('APPMAP')) {
      if (key1 in mapping) {
        const [key2, transform] = mapping[key1];
        data2[key2] = transform(env[key1]);
      } else {
        logger.warning('Unrecognized appmap env key: %s', key1);
      }
    }
  });
  validateConfiguration(data2);
  return extendWithData(data1, data2, base);
};

////////////////////
// extendWithFile //
////////////////////

const parseDefault = () => {
  throw new Error(
    "invalid file extension, expected one of: '.yml', '.yaml', or '.json'",
  );
};

const extendWithFile = (data1, path) => {
  logger.info('Configuration extended with file: %s', path);
  const content = FileSystem__namespace.readFileSync(path, 'utf8');
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    parse = YAML__default['default'].parse;
  } else {
    parse = parseDefault;
  }
  const data2 = parse(content);
  validateConfiguration(data2);
  return extendWithData(data1, data2, Path__namespace.dirname(path));
};

////////////
// Config //
////////////

const getSpecifier = (specifiers, path) => {
  if (!Path__namespace.isAbsolute(path)) {
    logger.error('Expected an absolute path and got: %s', path);
    return undefined;
  }
  path = Path__namespace.normalize(path);
  return specifiers.find((specifier) => path.startsWith(specifier.path));
};

class Config {
  constructor(data) {
    this.data = data;
  }
  extendWithData(data, base) {
    return new Config(extendWithData({ ...this.data }, data, base));
  }
  extendWithFile(path) {
    return new Config(extendWithFile({ ...this.data }, path));
  }
  extendWithEnv(env, base) {
    return new Config(extendWithEnv({ ...this.data }, env, base));
  }
  getEscapePrefix() {
    return this.data['escape-prefix'];
  }
  getOutputDir() {
    return this.data['output-dir'];
  }
  getLanguageVersion() {
    return this.data['language-version'];
  }
  getFileInstrumentation(path) {
    if (!this.data.enabled) {
      return null;
    }
    const specifier = getSpecifier(this.data.packages, path);
    if (specifier === undefined) {
      return null;
    }
    return specifier.shallow ? 'shallow' : 'deep';
  }
  isNameExcluded(path, name) {
    if (!this.data.enabled) {
      logger.error('Call isNameExcluded(%) on disabled appmap', path);
      return true;
    }
    if (this.data.exclude.includes(name)) {
      return true;
    }
    const specifier = getSpecifier(this.data.packages, path);
    if (specifier === undefined) {
      logger.error('Missing package for %', path);
      return true;
    }
    return specifier.exclude.includes(name);
  }
  getAppName() {
    return this.data['app-name'];
  }
  getMapName() {
    return this.data['map-name'];
  }
  getMetaData() {
    return {
      name: this.data['map-name'],
      labels: this.data.labels,
      app: this.data['app-name'],
      feature: this.data.feature,
      feature_group: this.data['feature-group'],
      language: {
        name: 'javascript',
        engine: this.data['language-engine'],
        version: this.data['language-version'],
      },
      frameworks: this.data.frameworks,
      client: {
        name: npm.name,
        url: npm.repository.url,
        version: npm.version,
      },
      recorder: {
        name: this.data['recorder-name'],
      },
      recording: {
        defined_class: this.data['recording-defined-class'],
        method_id: this.data['recording-method-id'],
      },
      git: git(this.data['git-dir']),
    };
  }
}

////////////////////
// Default Config //
////////////////////

const config = new Config({
  // Logic //
  enabled: false,
  'escape-prefix': 'APPMAP',
  'output-dir': 'tmp/appmap',
  packages: [],
  exclude: [],
  // MetaData //
  'map-name': null,
  labels: [],
  'app-name': null,
  feature: null,
  'feature-group': null,
  'language-engine': null,
  'language-version': 'es2015',
  frameworks: [],
  'recorder-name': null,
  'recording-defined-class': null,
  'recording-method-id': null,
  'git-dir': '.',
});

const getDefaultConfig = () => config;

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
  makeEntity(childeren, file) {
    throw new Error(`RootLocation.makeEntity()`);
  }
  isStaticMethod() {
    throw new Error(`RootLocation.isStaticMethod()`);
  }
  isChildStaticMethod() {
    throw new Error(`RootLocation.isChildStaticMethod()`);
  }
  isChildNonScopingIdentifier() {
    throw new Error(`RootLocation.isChildScopingIdentifier()`);
  }
  isNonScopingIdentifier() {
    throw new Error(`RootLocation.isScopingIdentifier()`);
  }
  getStartLine() {
    throw new Error(`RootLocation.getStartLine()`);
  }
  getName(file) {
    throw new Error(`RootLocation.getName()`);
  }
  getChildName() {
    throw new Error(`RootLocation.getChildName()`);
  }
  getKind() {
    throw new Error(`RootLocation.getKind()`);
  }
  getContainerName(file) {
    throw new Error(`RootLocation.getContainerName()`);
  }
  getParentContainerName() {
    throw new Error(`RootLocation.getParentContainerName()`);
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

const visit = (node, { location, isNameExcluded, namespace, file }) => {
  location = location.extend(node);
  let entities = [];
  if (!isNameExcluded(location.getName(file))) {
    if (node.type in visitors) {
      const context = {
        location,
        file,
        isNameExcluded,
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
      const entity = location.makeEntity(entities, file);
      if (entity !== null) {
        entities = [entity];
      }
    } else {
      logger.error('Cannot visit node of type %s', node.type);
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
        buildIdentifier(context.namespace.getLocal('EVENT_ID')),
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
              buildIdentifier(context.namespace.getLocal('EVENT_ID')),
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
              buildIdentifier(context.namespace.getGlobal('PROCESS_ID')),
            ),
            buildRegularProperty(
              'parent_id',
              buildIdentifier(context.namespace.getLocal('EVENT_ID')),
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

var instrument = (file, namespace, isNameExcluded, callback) => {
  const location = new RootLocation();
  const result = visit(file.parse(), {
    location,
    file,
    namespace,
    isNameExcluded,
  });
  getResultEntities(result).forEach(callback);
  return escodegen.generate(getResultNode(result));
};

var globals = [
  "EMPTY_MARKER",
  "UNDEFINED",
  "GET_NOW",
  "EMIT",
  "PROCESS_ID",
  "EVENT_COUNTER",
  "GET_CLASS_NAME",
  "GET_IDENTITY",
  "SERIALIZE",
  "SERIALIZE_EXCEPTION",
  "SERIALIZE_PARAMETER"
];

const locals = ['EVENT_ID', 'ARGUMENT', 'ERROR', 'SUCCESS', 'FAILURE', 'TIMER'];

var Namespace = (class Namespace {
  constructor(prefix) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/u.test(prefix)) {
      throw new Error(`Invalid prefix: ${prefix}`);
    }
    this.prefix = prefix;
  }
  checkCollision(identifier) {
    if (identifier.startsWith(this.prefix)) {
      throw new Error(
        `Base-level identifier should never start with the escape prefix ${this.prefix}, got: ${identifier}`,
      );
    }
  }
  getGlobal(name) {
    if (!globals.includes(name)) {
      throw new Error(`Invalid global identifier name: ${name}`);
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocal(name) {
    if (!locals.includes(name)) {
      throw new Error(`Invalid local identifier name: ${name}`);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
});

const escape = (name) => name.replace(/([\0\/])/g, '-');

const VERSION = '1.4';

var Appmap = (class Appmap {
  constructor(config) {
    this.config = config;
    this.namespace = new Namespace(config.getEscapePrefix());
    this.terminated = false;
    this.appmap = {
      version: VERSION,
      metadata: config.getMetaData(),
      classMap: [],
      events: [],
    };
  }
  instrument(source, path, content) {
    if (this.terminated) {
      throw new Error(`Terminated appmap can no longer instrument code`);
    }
    const instrumentation = this.config.getFileInstrumentation(path);
    if (instrumentation === null) {
      return content;
    }
    return instrument(
      new File(this.config.getLanguageVersion(), source, path, content),
      this.namespace,
      (name) => this.config.isNameExcluded(path, name),
      (entity) => {
        logger.info('Appmap receive code entity: %j', entity);
        this.appmap.classMap.push(entity);
      },
    );
  }
  emit(event) {
    if (this.terminated) {
      throw new Error('Terminated appmap can no longer receive events');
    }
    logger.info('Appmap receive event: %j', event);
    this.appmap.events.push(event);
  }
  terminate(sync, json) {
    if (this.terminated) {
      throw new Error('Terminated appmap can no longer be terminated');
    }
    this.terminated = true;
    const path = Path__namespace.join(
      this.config.getOutputDir(),
      `${escape(this.config.getMapName())}.appmap.json`,
    );
    logger.info(
      'Appmap terminate sync = %j path = %s reason = %j',
      sync,
      path,
      json,
    );
    if (sync) {
      FileSystem__namespace.writeFileSync(path, JSON.stringify(this.appmap), 'utf8');
    } else {
      FileSystem__namespace.writeFile(
        path,
        JSON.stringify(this.appmap),
        'utf8',
        (error) => {
          if (error !== null) {
            logger.error(
              `Could not write appmap to %s >> $s`,
              path,
              error.message,
            );
          } else {
            logger.info('Appmap written to %', path);
          }
        },
      );
    }
  }
});

var Dispatcher = (class Dispatcher {
  constructor(config) {
    this.config = config;
    this.appmaps = { __proto__: null };
  }
  dispatch(request) {
    validateRequest(request);
    if (request.name === 'initialize') {
      let session;
      do {
        session = Math.random().toString(36).substring(2);
      } while (session in this.appmaps);
      let config = this.config;
      config = config.extendWithData(request.configuration, process.cwd());
      config = config.extendWithEnv(request.process.env, process.cwd());
      const appmap = new Appmap(config);
      this.appmaps[session] = appmap;
      return {
        session,
        prefix: config.getEscapePrefix(),
      };
    }
    const appmap = this.appmaps[request.session];
    if (request.name === 'terminate') {
      appmap.terminate(request.sync, request.reason);
      delete this.appmaps[request.session];
      return null;
    }
    if (request.name === 'instrument') {
      return appmap.instrument(request.source, request.path, request.content);
    }
    if (request.name === 'emit') {
      appmap.emit(request.event);
      return null;
    }
    /* c8 ignore start */
    throw new Error(
      'This should never happen: invalid name which passed validation',
    );
    /* c8 ignore stop */
  }
});

const makeChannel = () => {
  const dispatcher = new Dispatcher(getDefaultConfig());
  return {
    requestSync: (json1) => {
      logger.info('inline sync request: %j', json1);
      const json2 = dispatcher.dispatch(json1);
      logger.info('inline sync response: %j', json2);
      return json2;
    },
    requestAsync: (json1, pending) => {
      logger.info('inline async request: %j', json1);
      let json2;
      try {
        json2 = dispatcher.dispatch(json1);
      } catch (error) {
        logger.error('inline async failure response: %s', error.stack);
        if (pending !== null) {
          pending.reject(error);
        }
        return null;
      }
      if (pending !== null) {
        logger.info('inline async success response: %j', json2);
        pending.resolve(json2);
        return null;
      }
      if (json2 !== null) {
        logger.error(
          'inline async request expected a null result and got: %j',
          json2,
        );
        return null;
      }
      logger.info('inline async success response (not transmitted): null');
      return null;
    },
  };
};

exports.makeChannel = makeChannel;
