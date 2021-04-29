import * as FileSystem from 'fs';
import * as Path from 'path';
import minimatch from 'minimatch';
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
    throw new Error('missing base to resolve path');
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
  enabled: (enabled, data, base) => {
    if (typeof enabled === 'boolean') {
      data.enabled = enabled;
      return data;
    }
    if (base === null) {
      throw new Error('missing base for glob');
    }
    if (typeof enabled === 'string') {
      enabled = [enabled];
    }
    if (typeof data.enabled === 'boolean') {
      data.enabled = [];
    }
    data.enabled = [
      ...data.enabled,
      ...enabled.map((glob) => ({ base, glob })),
    ];
    return data;
  },
  name: makeOverwrite('map-name', identity),
  main: (path, data, base) => {
    data.main = resolve(base, path);
    return data;
  },
  output: (output, data, base) => {
    if (output === 'alongside') {
      data.output = 'alongside';
    } else {
      data.output = {
        dir: resolve(base, output.dir),
        base: resolve(base, output.base),
      };
    }
    return data;
  },
  'app-name': makeOverwrite('app-name', identity),
  'map-name': makeOverwrite('map-name', identity),
  'language-version': makeOverwrite('language-version', identity),
  'language-engine': makeOverwrite('language-engine', identity),
  'escape-prefix': makeOverwrite('escape-prefix', identity),
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
  logger.debug('Configuration extended with data: %j', data2);
  if (base !== null) {
    base = Path.resolve(base);
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
  APPMAP_MAIN: ['main', identity],
  APPMAP_RC_FILE: ['extends', identity],
  APPMAP_APP_NAME: ['app-name', identity],
  APPMAP_MAP_NAME: ['map-name', identity],
  APPMAP_OUTPUT_DIR: [
    'output',
    (string) => ({
      dir: string,
      base: '.',
    }),
  ],
  APPMAP_GIT_DIR: ['git-dir', identity],
  APPMAP_LANGUAGE_VERSION: ['language-version', identity],
  APPMAP_PACKAGES: ['packages', (string) => string.split(',').map(trim)],
};

const extendWithEnv = (data1, env, base) => {
  logger.debug('Configuration extended with environment: %j', env);
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
  logger.debug('Configuration extended with file: %s', path);
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
  path = Path.resolve(path);
  return specifiers.find((specifier) => path.startsWith(specifier.path));
};

class Configuration {
  constructor(data) {
    this.data = data;
  }
  extendWithData(data, base) {
    return new Configuration(extendWithData({ ...this.data }, data, base));
  }
  extendWithFile(path) {
    return new Configuration(extendWithFile({ ...this.data }, path));
  }
  extendWithEnv(env, base) {
    return new Configuration(extendWithEnv({ ...this.data }, env, base));
  }
  isEnabled(main) {
    if (typeof this.data.enabled === 'boolean') {
      return this.data.enabled;
    }
    main = Path.resolve(main);
    return this.data.enabled.some(({ base, glob }) =>
      minimatch(Path.relative(base, main), glob),
    );
  }
  getEscapePrefix() {
    return this.data['escape-prefix'];
  }
  getLanguageVersion() {
    return this.data['language-version'];
  }
  getFileInstrumentation(path) {
    const specifier = getSpecifier(this.data.packages, path);
    if (specifier === undefined) {
      return null;
    }
    return specifier.shallow ? 'shallow' : 'deep';
  }
  isNameExcluded(path, name) {
    if (this.data.exclude.includes(name)) {
      return true;
    }
    const specifier = getSpecifier(this.data.packages, path);
    if (specifier === undefined) {
      logger.error('missing package for %', path);
      return true;
    }
    return specifier.exclude.includes(name);
  }
  getPath() {
    if (this.data.main === null) {
      throw new Error(`missing main option`);
    }
    if (this.data.output === 'alongside') {
      return this.data.main;
    }
    // node checks for null bytes so checking for slashes is enough
    return Path.join(
      this.data.output.dir,
      Path.relative(this.data.output.base, this.data.main).replace(/\//g, '-'),
    );
  }
  getMetaData() {
    return {
      name:
        this.data['map-name'] === null ? this.data.main : this.data['map-name'],
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

const configuration = new Configuration({
  // Logic //
  enabled: true,
  'escape-prefix': 'APPMAP',
  output: {
    dir: 'tmp/appmap',
    base: '.',
  },
  packages: [],
  exclude: [],
  // MetaData //
  main: null,
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

export const getDefaultConfiguration = () => configuration;
