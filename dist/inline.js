'use strict';

var Util = require('util');
var FileSystem = require('fs');
var Path = require('path');
var YAML = require('yaml');
var require$$0 = require('ajv/dist/runtime/equal');
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
var Path__namespace = /*#__PURE__*/_interopNamespace(Path);
var YAML__default = /*#__PURE__*/_interopDefaultLegacy(YAML);
var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
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

var config$1 = validate10;const schema11 = {"type":"object","additionalProperties":false,"properties":{"extends":{"type":"string"},"enabled":{"type":"boolean"},"name":{"type":"string"},"map-name":{"type":"string"},"escape-prefix":{"type":"string","pattern":"^[a-zA-Z_$][a-zA-Z_$-9]*$"},"output-dir":{"type":"string"},"git-dir":{"type":"string"},"language-version":{"enum":["es5","es5.1","es6","es2015","es7","es2016","es8","es2017","es9","es2018","es10","es2019","es11","es2020","es12","es2021"]},"packages":{"type":"array","items":{"anyOf":[{"type":"string"},{"type":"object","additionalProperties":false,"properties":{"dist":{"type":"string"},"path":{"type":"string"},"shallow":{"type":"boolean"},"exclude":{"type":"array","items":{"type":"string"}}}}]}},"exclude":{"type":"array","items":{"type":"string"}}}};const func4 = Object.prototype.hasOwnProperty;require$$0__default['default'].default;const pattern0 = new RegExp("^[a-zA-Z_$][a-zA-Z_$-9]*$", "u");function validate10(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){let vErrors = null;let errors = 0;if(errors === 0){if(data && typeof data == "object" && !Array.isArray(data)){const _errs1 = errors;for(const key0 in data){if(!(func4.call(schema11.properties, key0))){validate10.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];return false;}}if(_errs1 === errors){if(data.extends !== undefined){const _errs2 = errors;if(typeof data.extends !== "string"){validate10.errors = [{instancePath:instancePath+"/extends",schemaPath:"#/properties/extends/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}var valid0 = _errs2 === errors;}else {var valid0 = true;}if(valid0){if(data.enabled !== undefined){const _errs4 = errors;if(typeof data.enabled !== "boolean"){validate10.errors = [{instancePath:instancePath+"/enabled",schemaPath:"#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];return false;}var valid0 = _errs4 === errors;}else {var valid0 = true;}if(valid0){if(data.name !== undefined){const _errs6 = errors;if(typeof data.name !== "string"){validate10.errors = [{instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}var valid0 = _errs6 === errors;}else {var valid0 = true;}if(valid0){if(data["map-name"] !== undefined){const _errs8 = errors;if(typeof data["map-name"] !== "string"){validate10.errors = [{instancePath:instancePath+"/map-name",schemaPath:"#/properties/map-name/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}var valid0 = _errs8 === errors;}else {var valid0 = true;}if(valid0){if(data["escape-prefix"] !== undefined){let data4 = data["escape-prefix"];const _errs10 = errors;if(errors === _errs10){if(typeof data4 === "string"){if(!pattern0.test(data4)){validate10.errors = [{instancePath:instancePath+"/escape-prefix",schemaPath:"#/properties/escape-prefix/pattern",keyword:"pattern",params:{pattern: "^[a-zA-Z_$][a-zA-Z_$-9]*$"},message:"must match pattern \""+"^[a-zA-Z_$][a-zA-Z_$-9]*$"+"\""}];return false;}}else {validate10.errors = [{instancePath:instancePath+"/escape-prefix",schemaPath:"#/properties/escape-prefix/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}}var valid0 = _errs10 === errors;}else {var valid0 = true;}if(valid0){if(data["output-dir"] !== undefined){const _errs12 = errors;if(typeof data["output-dir"] !== "string"){validate10.errors = [{instancePath:instancePath+"/output-dir",schemaPath:"#/properties/output-dir/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}var valid0 = _errs12 === errors;}else {var valid0 = true;}if(valid0){if(data["git-dir"] !== undefined){const _errs14 = errors;if(typeof data["git-dir"] !== "string"){validate10.errors = [{instancePath:instancePath+"/git-dir",schemaPath:"#/properties/git-dir/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}var valid0 = _errs14 === errors;}else {var valid0 = true;}if(valid0){if(data["language-version"] !== undefined){let data7 = data["language-version"];const _errs16 = errors;if(!((((((((((((((((data7 === "es5") || (data7 === "es5.1")) || (data7 === "es6")) || (data7 === "es2015")) || (data7 === "es7")) || (data7 === "es2016")) || (data7 === "es8")) || (data7 === "es2017")) || (data7 === "es9")) || (data7 === "es2018")) || (data7 === "es10")) || (data7 === "es2019")) || (data7 === "es11")) || (data7 === "es2020")) || (data7 === "es12")) || (data7 === "es2021"))){validate10.errors = [{instancePath:instancePath+"/language-version",schemaPath:"#/properties/language-version/enum",keyword:"enum",params:{allowedValues: schema11.properties["language-version"].enum},message:"must be equal to one of the allowed values"}];return false;}var valid0 = _errs16 === errors;}else {var valid0 = true;}if(valid0){if(data.packages !== undefined){let data8 = data.packages;const _errs17 = errors;if(errors === _errs17){if(Array.isArray(data8)){var valid1 = true;const len0 = data8.length;for(let i0=0; i0<len0; i0++){let data9 = data8[i0];const _errs19 = errors;const _errs20 = errors;let valid2 = false;const _errs21 = errors;if(typeof data9 !== "string"){const err0 = {instancePath:instancePath+"/packages/" + i0,schemaPath:"#/properties/packages/items/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};if(vErrors === null){vErrors = [err0];}else {vErrors.push(err0);}errors++;}var _valid0 = _errs21 === errors;valid2 = valid2 || _valid0;if(!valid2){const _errs23 = errors;if(errors === _errs23){if(data9 && typeof data9 == "object" && !Array.isArray(data9)){const _errs25 = errors;for(const key1 in data9){if(!((((key1 === "dist") || (key1 === "path")) || (key1 === "shallow")) || (key1 === "exclude"))){const err1 = {instancePath:instancePath+"/packages/" + i0,schemaPath:"#/properties/packages/items/anyOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};if(vErrors === null){vErrors = [err1];}else {vErrors.push(err1);}errors++;break;}}if(_errs25 === errors){if(data9.dist !== undefined){const _errs26 = errors;if(typeof data9.dist !== "string"){const err2 = {instancePath:instancePath+"/packages/" + i0+"/dist",schemaPath:"#/properties/packages/items/anyOf/1/properties/dist/type",keyword:"type",params:{type: "string"},message:"must be string"};if(vErrors === null){vErrors = [err2];}else {vErrors.push(err2);}errors++;}var valid3 = _errs26 === errors;}else {var valid3 = true;}if(valid3){if(data9.path !== undefined){const _errs28 = errors;if(typeof data9.path !== "string"){const err3 = {instancePath:instancePath+"/packages/" + i0+"/path",schemaPath:"#/properties/packages/items/anyOf/1/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};if(vErrors === null){vErrors = [err3];}else {vErrors.push(err3);}errors++;}var valid3 = _errs28 === errors;}else {var valid3 = true;}if(valid3){if(data9.shallow !== undefined){const _errs30 = errors;if(typeof data9.shallow !== "boolean"){const err4 = {instancePath:instancePath+"/packages/" + i0+"/shallow",schemaPath:"#/properties/packages/items/anyOf/1/properties/shallow/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};if(vErrors === null){vErrors = [err4];}else {vErrors.push(err4);}errors++;}var valid3 = _errs30 === errors;}else {var valid3 = true;}if(valid3){if(data9.exclude !== undefined){let data13 = data9.exclude;const _errs32 = errors;if(errors === _errs32){if(Array.isArray(data13)){var valid4 = true;const len1 = data13.length;for(let i1=0; i1<len1; i1++){const _errs34 = errors;if(typeof data13[i1] !== "string"){const err5 = {instancePath:instancePath+"/packages/" + i0+"/exclude/" + i1,schemaPath:"#/properties/packages/items/anyOf/1/properties/exclude/items/type",keyword:"type",params:{type: "string"},message:"must be string"};if(vErrors === null){vErrors = [err5];}else {vErrors.push(err5);}errors++;}var valid4 = _errs34 === errors;if(!valid4){break;}}}else {const err6 = {instancePath:instancePath+"/packages/" + i0+"/exclude",schemaPath:"#/properties/packages/items/anyOf/1/properties/exclude/type",keyword:"type",params:{type: "array"},message:"must be array"};if(vErrors === null){vErrors = [err6];}else {vErrors.push(err6);}errors++;}}var valid3 = _errs32 === errors;}else {var valid3 = true;}}}}}}else {const err7 = {instancePath:instancePath+"/packages/" + i0,schemaPath:"#/properties/packages/items/anyOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};if(vErrors === null){vErrors = [err7];}else {vErrors.push(err7);}errors++;}}var _valid0 = _errs23 === errors;valid2 = valid2 || _valid0;}if(!valid2){const err8 = {instancePath:instancePath+"/packages/" + i0,schemaPath:"#/properties/packages/items/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};if(vErrors === null){vErrors = [err8];}else {vErrors.push(err8);}errors++;validate10.errors = vErrors;return false;}else {errors = _errs20;if(vErrors !== null){if(_errs20){vErrors.length = _errs20;}else {vErrors = null;}}}var valid1 = _errs19 === errors;if(!valid1){break;}}}else {validate10.errors = [{instancePath:instancePath+"/packages",schemaPath:"#/properties/packages/type",keyword:"type",params:{type: "array"},message:"must be array"}];return false;}}var valid0 = _errs17 === errors;}else {var valid0 = true;}if(valid0){if(data.exclude !== undefined){let data15 = data.exclude;const _errs36 = errors;if(errors === _errs36){if(Array.isArray(data15)){var valid5 = true;const len2 = data15.length;for(let i2=0; i2<len2; i2++){const _errs38 = errors;if(typeof data15[i2] !== "string"){validate10.errors = [{instancePath:instancePath+"/exclude/" + i2,schemaPath:"#/properties/exclude/items/type",keyword:"type",params:{type: "string"},message:"must be string"}];return false;}var valid5 = _errs38 === errors;if(!valid5){break;}}}else {validate10.errors = [{instancePath:instancePath+"/exclude",schemaPath:"#/properties/exclude/type",keyword:"type",params:{type: "array"},message:"must be array"}];return false;}}var valid0 = _errs36 === errors;}else {var valid0 = true;}}}}}}}}}}}}else {validate10.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];return false;}}validate10.errors = vErrors;return errors === 0;}

const trim$1 = (string) => string.trim();

const identity = (any) => any;

const isNotNull = (any) => any !== null;

////////////////////
// extendWithJson //
////////////////////

const resolve = (path, base) => Path__namespace.resolve(base, path);

const makeOverwrite = (key, transform) => (value, object, context) => {
  object[key] = transform(value, context);
  return null;
};

const sortPackage = (specifier1, specifier2) =>
  specifier2.path.length - specifier1.path.length;

const mergers = {
  __proto__: null,
  extends: (path, conf, base) =>
    /* eslint-disable no-use-before-define */
    extendWithFile(conf, Path__namespace.resolve(base, path)),
    /* eslint-enable no-use-before-define */
  packages: (specifiers, conf, base) => {
    conf.packages = [
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
            path: Path__namespace.resolve(base, 'node_modules', specifier.dist),
          });
        }
        if (specifier.path !== null) {
          specifiers.push({
            ...specifier,
            path: Path__namespace.resolve(base, specifier.path),
          });
        }
        return specifiers;
      }),
      ...conf.packages,
    ];
    conf.packages.sort(sortPackage);
    return null;
  },
  exclude: (exclusions, conf, base) => {
    conf.exclude = [...exclusions, ...conf.exclude];
    return null;
  },
  enabled: makeOverwrite('enabled', identity),
  name: makeOverwrite('map-name', identity),
  'app-name': makeOverwrite('app-name', identity),
  'map-name': makeOverwrite('map-name', identity),
  'language-version': makeOverwrite('language-version', identity),
  'escape-prefix': makeOverwrite('escape-prefix', identity),
  'output-dir': makeOverwrite('output-dir', resolve),
  'git-dir': makeOverwrite('git-dir', resolve),
};

const extendWithJson = (conf, json, base) => {
  logger.info('Configuration extended with json: %j', json);
  base = Path__namespace.resolve(process.cwd(), base);
  if (!config$1(json)) {
    // console.asset(validateConfig.errors.length > 0)
    logger.warning(`Invalid configuration: %j`, config$1.errors);
    return `invalid configuration at ${config$1.errors[0].schemaPath}, it ${config$1.errors[0].message}`;
  }
  const messages = Reflect.ownKeys(json)
    .map((key) => mergers[key](json[key], conf, base))
    .filter(isNotNull);
  if (messages.length > 0) {
    return messages[0];
  }
  return null;
};

///////////////////
// extendWithEnv //
///////////////////

const mapping = {
  __proto__: null,
  APPMAP: ['enabled', (string) => string.toLowerCase() === 'true'],
  APPMAP_CONFIG: ['extends', identity],
  APPMAP_NAME: ['name', identity],
  APPMAP_APP_NAME: ['app-name', identity],
  APPMAP_MAP_NAME: ['map-name', identity],
  APPMAP_OUTPUT_DIR: ['output-dir', identity],
  APPMAP_GIT_DIR: ['git-dir', identity],
  APPMAP_LANGUAGE_VERSION: ['language-version', identity],
  APPMAP_PACKAGES: ['packages', (string) => string.split(',').map(trim$1)],
};

const extendWithEnv = (conf, env, base) => {
  logger.info('Configuration extended with environment: %j', env);
  env = { __proto__: null, ...env };
  const json = { __proto__: null };
  Reflect.ownKeys(env).forEach((key1) => {
    if (key1.startsWith('APPMAP')) {
      if (key1 in mapping) {
        const [key2, transform] = mapping[key1];
        json[key2] = transform(env[key1]);
      } else {
        logger.warning('Unrecognized appmap env key: %s', key1);
      }
    }
  });
  return extendWithJson(conf, json, base);
};

////////////////////
// extendWithFile //
////////////////////

const parseDefault = () => {
  throw new Error(
    "invalid file extension, expected one of: '.yml', '.yaml', or '.json'",
  );
};

const extendWithFile = (conf, path) => {
  logger.info('Configuration extended with file: %s', path);
  let content;
  try {
    content = FileSystem__namespace.readFileSync(path, 'utf8');
  } catch (error) {
    logger.warning('Cannot read conf file %s >> %s', path, error.message);
    return `failed to read conf file ${path} because ${error.message}`;
  }
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    parse = YAML__default['default'].parse;
  } else {
    parse = parseDefault;
  }
  let json;
  try {
    json = parse(content);
  } catch (error) {
    logger.warning('Cannot parse conf file %s >> %s', path, error.message);
    return `failed to parse conf file ${path} because ${error.message}`;
  }
  return extendWithJson(conf, json, Path__namespace.dirname(path));
};

////////////
// Config //
////////////

const runExtend = (extend, conf, ...args) => {
  conf = { ...conf };
  const failure = extend(conf, ...args);
  if (failure !== null) {
    return failure;
  }
  /* eslint-disable no-use-before-define */
  return new Config(conf);
  /* eslint-enable no-use-before-define */
};

const getSpecifier = (specifiers, path) => {
  if (!Path__namespace.isAbsolute(path)) {
    logger.error('Expected an absolute path and got: %s', path);
    return undefined;
  }
  path = Path__namespace.resolve(path); // absolute path may not be normalized and contain [".", ".."]
  return specifiers.find((specifier) => path.startsWith(specifier.path));
};

class Config {
  constructor(conf) {
    this.conf = conf;
  }
  extendWithJson(json, base) {
    return runExtend(extendWithJson, this.conf, json, base);
  }
  extendWithFile(path) {
    return runExtend(extendWithFile, this.conf, path);
  }
  extendWithEnv(env, base) {
    return runExtend(extendWithEnv, this.conf, env, base);
  }
  getEscapePrefix() {
    return this.conf['escape-prefix'];
  }
  getOutputDir() {
    return this.conf['output-dir'];
  }
  getGitDir() {
    return this.conf['git-dir'];
  }
  getAppName() {
    return this.conf['app-name'];
  }
  getLanguageVersion() {
    return this.conf['language-version'];
  }
  getMapName() {
    return this.conf['map-name'];
  }
  getFileInstrumentation(path) {
    if (!this.conf.enabled) {
      return null;
    }
    const specifier = getSpecifier(this.conf.packages, path);
    if (specifier === undefined) {
      return null;
    }
    return specifier.shallow ? 'shallow' : 'deep';
  }
  isNameExcluded(path, name) {
    if (!this.conf.enabled) {
      logger.error('Call isNameExcluded(%) on disabled appmap', path);
      return true;
    }
    if (this.conf.exclude.includes(name)) {
      return true;
    }
    const specifier = getSpecifier(this.conf.packages, path);
    if (specifier === undefined) {
      logger.error('Missing package for %', path);
      return true;
    }
    return specifier.exclude.includes(name);
  }
}

////////////////////
// Default Config //
////////////////////

const config = new Config({
  enabled: false,
  'app-name': 'unknown-app-name',
  'map-name': 'unknown-map-name',
  'git-dir': '.',
  'language-version': 'es2015',
  'escape-prefix': 'APPMAP',
  'output-dir': 'tmp/appmap',
  packages: [],
  exclude: [],
});

const getDefaultConfig = () => config;

const trim = (string) => string.trim();

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
  return status.split('\n').map(trim);
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

const VERSION = '1.4';

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
  constructor(config, json) {
    const init = {
      feature: null,
      feature_group: null,
      labels: [],
      frameworks: [],
      recorder: null,
      recording: null,
      engine: null,
      ...json,
    };
    this.config = config;
    this.namespace = new Namespace(config.getEscapePrefix());
    this.terminated = false;
    this.appmap = {
      version: VERSION,
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
        recorder: init.recorder,
        recording: init.recording,
        git: git(config.getGitDir()),
      },
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
      `${this.config.getMapName()}.appmap.json`,
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

const checkHas = (object, key) => {
  if (Reflect.getOwnPropertyDescriptor(object, key) === undefined) {
    throw new Error(`Missing property: ${String(key)}`);
  }
};

const checkNotNull = (any) => {
  if (any === null) {
    throw new Error('Unexpected null');
  }
};

const checkTypeof = (value, type) => {
  if (typeof value !== type) {
    throw new Error(
      `Invalid value type: expected a ${type} and got a ${typeof value}`,
    );
  }
};

const checkAnyof = (value, values) => {
  if (!values.includes(value)) {
    throw new Error('Invalid enumeration-based value');
  }
};

const sources = ['script', 'module'];

var Dispatcher = (class Dispatcher {
  constructor(config) {
    this.config = config;
    this.appmaps = { __proto__: null };
  }
  dispatch(json) {
    checkTypeof(json, 'object');
    checkNotNull(json);
    checkHas(json, 'name');
    if (json.name === 'initialize') {
      checkHas(json, 'init');
      checkTypeof(json.init, 'object');
      checkNotNull(json);
      checkHas(json, 'env');
      checkTypeof(json.init, 'object');
      checkNotNull(json);
      let session;
      do {
        session = Math.random().toString(36).substring(2);
      } while (session in this.appmaps);
      const config = this.config.extendWithEnv(json.env, process.cwd());
      const appmap = new Appmap(config, json.init);
      this.appmaps[session] = appmap;
      return {
        session,
        prefix: config.getEscapePrefix(),
      };
    }
    checkHas(json, 'session');
    checkTypeof(json.session, 'string');
    checkHas(this.appmaps, json.session);
    const appmap = this.appmaps[json.session];
    if (json.name === 'terminate') {
      checkHas(json, 'sync');
      checkHas(json, 'reason');
      checkTypeof(json.sync, 'boolean');
      appmap.terminate(json.sync, json.reason);
      delete this.appmaps[json.session];
      return null;
    }
    if (json.name === 'instrument') {
      checkHas(json, 'source');
      checkHas(json, 'path');
      checkHas(json, 'content');
      checkAnyof(json.source, sources);
      checkTypeof(json.path, 'string');
      checkTypeof(json.content, 'string');
      return appmap.instrument(json.source, json.path, json.content);
    }
    if (json.name === 'emit') {
      checkHas(json, 'event');
      appmap.emit(json.event);
      return null;
    }
    throw new Error('Unrecognized name');
  }
});

var inline = () => {
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

module.exports = inline;
