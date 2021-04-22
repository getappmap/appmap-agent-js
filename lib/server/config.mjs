import * as FileSystem from 'fs';
import * as Path from 'path';
import YAML from 'yaml';
import { config as validateConfig } from '../../dist/schema.js';
import { home } from '../home.js';
import logger from './logger.mjs';
import git from './git.mjs';

const trim = (string) => string.trim();

const identity = (any) => any;

const flip = (callback) => (arg0, arg1) => callback(arg1, arg0);

const resolve = (base, path) => {
  if (Path.isAbsolute(path)) {
    return path;
  }
  if (base === null) {
    throw new Error(
      `Missing base directory path to resolve relative path: ${path}`,
    );
  }
  return Path.resolve(base, path);
};

////////////
// Client //
////////////

const npm = JSON.parse(
  FileSystem.readFileSync(resolve(home, './package.json'), 'utf8'),
);

////////////////////
// extendWithJson //
////////////////////

const makeOverwrite = (key, transform) => (value, object, context) => {
  object[key] = transform(value, context);
};

const makeConcat = (key) => (value, object, context) => {
  object[key] = [...object[key], ...value];
};

const sortPackage = (specifier1, specifier2) =>
  specifier2.path.length - specifier1.path.length;

const mergers = {
  __proto__: null,
  extends: (path, conf, base) =>
    /* eslint-disable no-use-before-define */
    extendWithFile(conf, resolve(base, path)),
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
            path: resolve(base, Path.join('node_modules', specifier.dist)),
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
      ...conf.packages,
    ];
    conf.packages.sort(sortPackage);
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

const extendWithJson = (conf, json, base) => {
  conf = { ...conf };
  logger.info('Configuration extended with json: %j', json);
  if (base !== null) {
    base = resolve(process.cwd(), base);
  }
  if (!validateConfig(json)) {
    logger.warning(`Invalid configuration: %j`, validateConfig.errors);
    // console.asset(validateConfig.errors.length > 0)
    const error = validateConfig.errors[0];
    throw new Error(
      `invalid configuration at ${error.schemaPath}, it ${
        error.message
      } (${JSON.stringify(error.params)})`,
    );
  }
  Reflect.ownKeys(json).forEach((key) => {
    mergers[key](json[key], conf, base);
  });
  return conf;
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
  const content = FileSystem.readFileSync(path, 'utf8');
  // } catch (error) {
  //   logger.warning('Cannot read conf file %s >> %s', path, error.message);
  //   return `failed to read conf file ${path} because ${error.message}`;
  // }
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    parse = YAML.parse;
  } else {
    parse = parseDefault;
  }
  const json = parse(content);
  // } catch (error) {
  //   logger.warning('Cannot parse conf file %s >> %s', path, error.message);
  //   return `failed to parse conf file ${path} because ${error.message}`;
  // }
  return extendWithJson(conf, json, Path.dirname(path));
};

////////////
// Config //
////////////

const getSpecifier = (specifiers, path) => {
  if (!Path.isAbsolute(path)) {
    logger.error('Expected an absolute path and got: %s', path);
    return undefined;
  }
  path = Path.normalize(path);
  return specifiers.find((specifier) => path.startsWith(specifier.path));
};

class Config {
  constructor(conf) {
    this.conf = conf;
  }
  extendWithJson(json, base) {
    return new Config(extendWithJson({ ...this.conf }, json, base));
    // return runExtend(extendWithJson, this.conf, json, base);
  }
  extendWithFile(path) {
    return new Config(extendWithFile({ ...this.conf }, path));
    // return runExtend(extendWithFile, this.conf, path);
  }
  extendWithEnv(env, base) {
    return new Config(extendWithEnv({ ...this.conf }, env, base));
    // return runExtend(extendWithEnv, this.conf, env, base);
  }
  getEscapePrefix() {
    return this.conf['escape-prefix'];
  }
  getOutputDir() {
    return this.conf['output-dir'];
  }
  getLanguageVersion() {
    return this.conf['language-version'];
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
  getAppName() {
    return this.conf['app-name'];
  }
  getMapName() {
    return this.conf['map-name'];
  }
  getMetaData() {
    return {
      name: this.conf['map-name'],
      labels: this.conf.labels,
      app: this.conf['app-name'],
      feature: this.conf.feature,
      feature_group: this.conf['feature-group'],
      language: {
        name: 'javascript',
        engine: this.conf['language-engine'],
        version: this.conf['language-version'],
      },
      frameworks: this.conf.frameworks,
      client: {
        name: npm.name,
        url: npm.repository.url,
        version: npm.version,
      },
      recorder: {
        name: this.conf['recorder-name'],
      },
      recording: {
        defined_class: this.conf['recording-defined-class'],
        method_id: this.conf['recording-method-id'],
      },
      git: git(this.conf['git-dir']),
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

export const getDefaultConfig = () => config;
