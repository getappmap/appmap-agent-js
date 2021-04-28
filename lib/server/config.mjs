import * as FileSystem from 'fs';
import * as Path from 'path';
import YAML from 'yaml';
import { validateConfiguration } from './validate.mjs';
import { home } from '../home.js';
import logger from './logger.mjs';
import git from './git.mjs';

const trim = (string) => string.trim();

const identity = (any) => any;

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
  extends: (path, data, base) =>
    /* eslint-disable no-use-before-define */
    extendWithFile(data, resolve(base, path)),
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
  'output-dir': (path, data, base) => {
    data['output-dir'] = resolve(base, path);
    return data;
  },
  'git-dir': (path, data, base) => {
    data.git = git(resolve(base, path));
    return data;
  },
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
  const content = FileSystem.readFileSync(path, 'utf8');
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    parse = YAML.parse;
  } else {
    parse = parseDefault;
  }
  const data2 = parse(content);
  validateConfiguration(data2);
  return extendWithData(data1, data2, Path.dirname(path));
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
      git: this.data.git,
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
  'language-version': '2015',
  frameworks: [],
  'recorder-name': null,
  'recording-defined-class': null,
  'recording-method-id': null,
  git: git('.'),
});

export const getDefaultConfig = () => config;
