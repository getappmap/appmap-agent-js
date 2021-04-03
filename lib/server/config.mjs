import { readFileSync } from 'fs';
import Yaml from 'yaml';
import logger from './logger.mjs';

const DEFAULT_ENABLED = false;
const DEFAULT_OUTPUT_DIR = 'tmp/appmap';
const DEFAULT_GIT_DIR = '.';
const DEFAULT_LANGUAGE_VERSION = '2015';
const DEFAULT_ESCAPE_PREFIX = 'APPMAP';
const DEFAULT_APP_NAME = 'unknown-app-name';
const DEFAULT_MAP_NAME = 'unknown-map-name';

const wrapName = (name) => ({ name });

const combine = (closure1, closure2) => (any) => closure2(closure1(any));

const trim = (string) => string.trim();

const toLowerCase = (string) => string.toLowerCase();

const identity = (any) => any;

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
  return json.map(sanitizer);
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
      sanitize: makeLanguageVersionSanitizer(
        'APPMAP_LANGUAGE_VERSION env argument',
      ),
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
    APPMAP_PACKAGE: {
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
        makeLanguageVersionSanitizer('language-version value')
      )
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
        'output_dir value',
        DEFAULT_OUTPUT_DIR,
      ),
    },
    packages: {
      name: 'packages',
      sanitize: combine(
        makeArraySanitizer('output_dir conf value', (json, index) => {
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
      ),
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
  packages: concat,
  exclude: concat,
};

////////////
// Extend //
////////////

const extend = (mapping, conf, object) => {
  conf = { ...conf };
  /* eslint-disable no-restricted-syntax */
  for (const key in mapping) {
    if (key in object) {
      const { name, sanitize } = mapping[key];
      conf[name] = mergers[name](conf[name], sanitize(object[key]));
    }
  }
  /* eslint-enable no-restricted-syntax */
  return conf;
};

const extendWithPath = (conf, path) => {
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml')) {
    parse = Yaml.parse;
  } else {
    logger.warning(
      "Invalid conf file extension >> expected '.yml' or '.json', got: %s",
      conf,
    );
    return this;
  }
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch (error) {
    logger.warning('Failed to read conf file at %s >> %s', path, error.message);
    return this;
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
  return extend(mappings.env, conf, env);
};

////////////
// Config //
////////////

class Config {
  constructor(conf) {
    this.conf = conf;
  }
  extendWithJson (json) {
    return new Config(extendWithJson(this.conf, json));
  }
  extendWithPath (path) {
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
  exclude: [],
});

export const getDefaultConfig = () => config;
