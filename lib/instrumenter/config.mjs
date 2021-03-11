
import * as Fs from 'fs';
import * as Yaml from 'yaml';

import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

//////////////////////
// enabled (APPMAP) //
//////////////////////

const enabled = (() => {
  if (Reflect.getOwnPropertyDescriptor(process.env, 'APPMAP') !== undefined) {
    const mapping = {
      __proto__: null,
      TRUE: true,
      FALSE: false,
    };
    if (process.env.APPMAP.toUpperCase() in mapping) {
      return mapping[process.env.APPMAP.toUpperCase()];
    }
    logger.warning(`Invalid APPMAP environment variable, defaulting to FALSE.`);
    return false;
  }
  logger.info(`No APPMAP environment variable provided, defaulting to FALSE.`);
  return false;
})();

////////////
// output //
////////////

const outputDirectory = (() => {
  if (
    Reflect.getOwnPropertyDescriptor(process.env, 'APPMAP_OUTPUT_DIR') !==
    undefined
  ) {
    return process.env.APPMAP_OUTPUT_DIR;
  }
  logger.info(
    `No APPMAP_OUTPUT_DIR environment variable provided, defaulting to tmp/appmap.`,
  );
  return 'tmp/appmap';
})();

////////////////////////////
// config (APPMAP_CONFIG) //
////////////////////////////

const defaultConfig = { name: 'unknown', packages: [] };

const loadYAMLConfig = () => {
  let configPath = 'appmap.yml';
  if (
    Reflect.getOwnPropertyDescriptor(process.env, 'APPMAP_CONFIG') !== undefined
  ) {
    configPath = process.env.APPMAP_CONFIG;
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
    return defaultConfig;
  }

  try {
    return Yaml.parse(configContent);
  } catch (error) {
    logger.warning(`Could not parse configuration file: ${error.message}`);
    return defaultConfig;
  }
};

const isValidConfigPackage = (element, index) => {
  if (typeof element !== 'object' || element === null) {
    logger.warning(
      `Invalid config.packages[${String(
        index,
      )}] field in configuration file, expected a proper object.`,
    );
    return false;
  }
  if (Reflect.getOwnPropertyDescriptor(element, 'path') === undefined) {
    logger.warning(
      `Invalid config.packages[${String(
        index,
      )}] field in configuration file, expected a proper object with a path property.`,
    );
    return false;
  }
  return true;
};

const validateConfig = (config) => {
  if (typeof config !== 'object' || config === null) {
    logger.warning(`Expected configuration file to return a proper object.`);
    return defaultConfig;
  }

  if (Reflect.getOwnPropertyDescriptor(config, 'name') === undefined) {
    logger.warning('Missing config.name field in configuration file.');
    config.name = defaultConfig.name;
  } else if (typeof config.name !== 'string') {
    logger.warning(
      'Invalid config.name field in configuration file, expected a string.',
    );
    config.name = defaultConfig.name;
  }

  if (Reflect.getOwnPropertyDescriptor(config, 'packages') === undefined) {
    logger.info('Missing config.packages field in configuration file.');
    config.packages = defaultConfig.packages;
  } else if (!Array.isArray(config.packages)) {
    logger.warning(
      'Invalid config.packages field in configuration file, expected an array.',
    );
    config.packages = defaultConfig.packages;
  } else {
    config.packages = config.packages.filter(isValidConfigPackage);
  }

  return config;
};

const config = validateConfig(loadYAMLConfig());

////////////
// Export //
////////////

export const getAppName = () => config.name;
