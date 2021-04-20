import * as FileSystem from 'fs';
import * as Path from 'path';
import YAML from 'yaml';
import { config as validateConfig } from '../../dist/schema.js';
import logger from './logger.mjs';

const trim = (string) => string.trim();

const identity = (any) => any;

const isNotNull = (any) => any !== null;

////////////////////
// extendWithJson //
////////////////////

const resolve = (path, base) => Path.resolve(base, path);

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
    extendWithFile(conf, Path.resolve(base, path)),
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
            path: Path.resolve(base, 'node_modules', specifier.dist),
          });
        }
        if (specifier.path !== null) {
          specifiers.push({
            ...specifier,
            path: Path.resolve(base, specifier.path),
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
  base = Path.resolve(process.cwd(), base);
  if (!validateConfig(json)) {
    // console.asset(validateConfig.errors.length > 0)
    logger.warning(`Invalid configuration: %j`, validateConfig.errors);
    return `invalid configuration at ${validateConfig.errors[0].schemaPath}, it ${validateConfig.errors[0].message}`;
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
  APPMAP_PACKAGES: ['packages', (string) => string.split(',').map(trim)],
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
    content = FileSystem.readFileSync(path, 'utf8');
  } catch (error) {
    logger.warning('Cannot read conf file %s >> %s', path, error.message);
    return `failed to read conf file ${path} because ${error.message}`;
  }
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    parse = YAML.parse;
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
  return extendWithJson(conf, json, Path.dirname(path));
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
  if (!Path.isAbsolute(path)) {
    logger.error('Expected an absolute path and got: %s', path);
    return undefined;
  }
  path = Path.resolve(path); // absolute path may not be normalized and contain [".", ".."]
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

export const getDefaultConfig = () => config;
