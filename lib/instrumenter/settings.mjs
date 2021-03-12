import * as Fs from 'fs';
import Yaml from 'yaml';

import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

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
    Reflect.getOwnPropertyDescriptor(env, 'APPMAP_OUTPUT_DIR') !== undefined
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
  exclude: [],
};

const loadYAMLConfig = (env) => {
  let configPath = 'appmap.yml';
  if (Reflect.getOwnPropertyDescriptor(env, 'APPMAP_CONFIG') !== undefined) {
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
    return { ...defaultConfig };
  }

  try {
    return Yaml.parse(configContent);
  } catch (error) {
    logger.warning(`Could not parse configuration file: ${error.message}`);
    return { ...defaultConfig };
  }
};

const validatePackage = (package1, index1, array) => {
  if (typeof package1 !== 'object' || package1 === null) {
    logger.warning(
      `Invalid config.packages[${String(
        index1,
      )}] field in configuration file, expected a proper object.`,
    );
    return null;
  }
  if (Reflect.getOwnPropertyDescriptor(package1, 'path') === undefined) {
    logger.warning(
      `Missing config.packages[${String(
        index1,
      )}].path field in configuration file.`,
    );
    return null;
  }
  if (typeof package1.path !== 'string') {
    logger.warning(
      `Invalid config.packages[${String(index1)}].path, expected a string.`,
    );
    return null;
  }
  {
    const index2 = array.findIndex(
      (package2) => package1.path === package2.path,
    );
    if (index1 !== index2) {
      logger.warning(
        `Duplicate config.packages[${String(index1)},${String(index2)}].path.`,
      );
      return null;
    }
  }
  if (Reflect.getOwnPropertyDescriptor(package1, 'shallow') === undefined) {
    logger.info(`Missing config.packages[${String(index1)}].shallow.`);
    return {
      path: package1.path,
      shallow: false,
    };
  }
  if (typeof package1.shallow !== 'boolean') {
    logger.warning(
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
    logger.warning(
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
    logger.warning(`Missing config.${name} field in configuration file.`);
    return defaultConfig[name];
  }
  if (typeof config[name] !== 'string') {
    logger.warning(
      `Invalid config.${name} field in configuration file, expected a string.`,
    );
    return defaultConfig[name];
  }
  return config[name];
};

const validateArray = (config, name, validator) => {
  if (Reflect.getOwnPropertyDescriptor(config, name) === undefined) {
    logger.info(`Missing config.${name} field in configuration file.`);
    return defaultConfig[name];
  }
  if (!Array.isArray(config[name])) {
    logger.warning(
      `Invalid config.${name} field in configuration file, expected an array.`,
    );
    return defaultConfig[name];
  }
  return config[name].map(validator).filter(isNotNull);
};

const validateConfig = (config) => {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    logger.warning(`Expected configuration file to return an object.`);
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

export default class Setting {
  constructor(env = process.env) {
    // console.log("foo", loadYAMLConfig(env));
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
    return Infinity;
  }
  isExcluded(path, name) {
    // TODO support for per-package exclusion
    return this.config.exclude.includes(name);
  }
}
