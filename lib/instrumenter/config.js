'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('yaml');

// https://github.com/applandinc/appmap-python#environment-variables

const enabled =
  typeof process.env.APPMAP === 'string' &&
  process.env.APPMAP.toLowerCase() === 'true';

let config = { name: 'unknown', packages: [] };

try {
  const configPath = path.resolve(
    typeof process.env.APPMAP_CONFIG === 'string'
      ? process.env.APPMAP_CONFIG
      : 'appmap.yml'
  );
  config = yaml.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  config.error(`Failed to parse appmap config file ${error.message}`);
}

if (typeof config !== 'object' || config === null) {
  config.warn('');
}
if (Reflect.getOwnPropertyDescriptor(config, 'name') === undefined) {
  logger.info('missing name field in appmap.yml config file');
  config.name = 'unknown';
}
if (typeof config.name !== 'string') {
  logger.warn('invalid name in appmap.yml config file');
  config.name = 'unknown';
}
if (Reflect.getOwnPropertyDescriptor(config, 'packages') === undefined) {
  logger.info('missing packages in appmap.yml config');
}
if (!Array.isArray(config.packages)) {
  logger.info('missing packages ');
  config.packages = [];
}

// exports.isEnabled = () => enabled;

exports.getOutputDirectory = () =>
  path.resolve(
    typeof process.env.APPMAP_OUTPUT_DIR === 'string'
      ? process.env.APPMAP_OUTPUT_DIR
      : 'tmp/appmap'
  );

exports.getAppName = () => config.name;

exports.getModuleInstrumentationLevel = (path) => config.packages.any;

exports.get;
