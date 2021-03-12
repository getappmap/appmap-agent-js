
import * as Fs from 'fs';
import * as Yaml from 'yaml';

import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

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
    logger.warning(`Invalid APPMAP environment variable, defaulting to FALSE.`);
    return false;
  }
  logger.info(`No APPMAP environment variable provided, defaulting to FALSE.`);
  return false;
};

////////////
// output //
////////////

const getOutputDir = (env) => {
  if (
    Reflect.getOwnPropertyDescriptor(env, 'APPMAP_OUTPUT_DIR') !==
    undefined
  ) {
    return env.APPMAP_OUTPUT_DIR;
  }
  logger.info(
    `No APPMAP_OUTPUT_DIR environment variable provided, defaulting to tmp/appmap.`,
  );
  return 'tmp/appmap';
};

////////////////////////////
// config (APPMAP_CONFIG) //
////////////////////////////

const defaultConfig = {
  name: 'unknown',
  packages: [],
  exclude: []
};

const loadYAMLConfig = (env) => {
  let configPath = 'appmap.yml';
  if (
    Reflect.getOwnPropertyDescriptor(env, 'APPMAP_CONFIG') !== undefined
  ) {
    configPath = env.APPMAP_CONFIG;
  } else {
    logger.info(
      `No APPMAP_CONFIG environment variable provided, defaulting to appmap.yml`,
    );
  }

  let configContent = null;
  try {
    configContent = Fs.readFileSync(configPath, 'utf8');
  } catch (error) {
    logger.warning(`Could not open configuration file: ${error.message}`);
    return {...defaultConfig};
  }

  try {
    return Yaml.parse(configContent);
  } catch (error) {
    logger.warning(`Could not parse configuration file: ${error.message}`);
    return {...defaultConfig};
  }
};

const isValidConfigPackage = (element1, index1, array) => {
  if (typeof element1 !== 'object' || element1 === null) {
    logger.warning(
      `Invalid config.packages[${String(
        index1,
      )}] field in configuration file, expected a proper object.`,
    );
    return false;
  }
  if (Reflect.getOwnPropertyDescriptor(element1, 'path') === undefined) {
    logger.warning(
      `Invalid config.packages[${String(
        index1,
      )}] field in configuration file, expected a proper object with a path property.`,
    );
    return false;
  }
  const index2 = array.findIndex(element, (element2) => element1.path === element2.path);
  if (index1 !== index2) {
    logger.warning(`Duplicate config.packages[${String(index1)},${String(index2)}] field`);
    return false;
  }
  if (Reflect.getOwnPropertyDescriptor(element1, "shallow") !== undefined) {
    if (typeof element1.shallow !== 'boolean') {
      logger.warning(`Invalid config.packages[${String(index)}].shallow, expected a boolean`);
      element1.depth = Infinity;
    } else {
      element1.depth = element1.shallow ? 1 : Infinity;
    }
  } else {
    element1.depth = Infinity;
  }
  return true;
};

const isValidConfigExclude = (element, index) => {
  if (typeof element !== 'string') {
    logger.warning(
      `Invalid config.exclude[${String(
        index,
      )}] field in configuration file, expected a string.`,
    );
    return false;
  }
  return true;
};

const validateConfigFieldString = (config, name) => {
  if (Reflect.getOwnPropertyDescriptor(config, name) === undefined) {
    logger.warning(`Missing config.${name} field in configuration file.`);
    Reflect.defineProperty(config, name, {
      __proto__: null,
      value: defaultConfig[name],
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else if (typeof config[name] !== 'string') {
    logger.warning(
      `Invalid config.${name} field in configuration file, expected a string.`,
    );
    config[name] = defaultConfig[name];
  }
};

const validateConfigFieldArray = (config, name, predicate) => {
  if (Reflect.getOwnPropertyDescriptor(config, name) === undefined) {
    logger.info(`Missing config.${name} field in configuration file.`);
    Reflect.defineProperty(config, name, {
      __proto__: null,
      value: defaultConfig[name],
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else if (!Array.isArray(config[name])) {
    logger.warning(
      `Invalid config.${name} field in configuration file, expected an array.`,
    );
    config[name] = defaultConfig[name];
  } else {
    config[name] = config[name].filter(predicate);
  }
}

const validateConfig = (config) => {
  if (typeof config !== 'object' || config === null) {
    logger.warning(`Expected configuration file to return a proper object.`);
    return {...defaultConfig};
  }
  validateConfigFieldString(config, 'name');
  validateConfigFieldArray(config, 'packages', isValidConfigPackage);
  validateConfigFieldArray(config, 'exclude', isValidConfigExclude);
  return config;
};

////////////
// Export //
////////////

export default class Setting {
  constructor (env = process.env) {
    this.config = validateConfig(loadYAMLConfig(env));
    this.enabled = isEnabled(env);
    this.outputDir = getOutputDir(env);
  }
  getOutputDir () {
    return this.outputDir;
  }
  getAppName () {
    return this.config.name;
  }
  getInstrumentationDepth (path) => {
    if (!this.enabled) {
      return 0;
    }
    const element = config.packages.find((element) => element.path === path);
    if (element === undefined) {
      return 0;
    }
    return element.depth;
  }
  isExcluded () {
    return config.exclude.includes(name);
  }
};
