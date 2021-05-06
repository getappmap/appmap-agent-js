import * as Path from 'path';
import * as FileSystem from 'fs';
import YAML from 'yaml';
import Ajv from 'ajv';
import { assert } from './assert.mjs';
import { Left, Right } from './either.mjs';
import { logger } from './logger.mjs';
import { home } from '../home.js';

const ajv = new Ajv();
ajv.addSchema(
  YAML.parse(
    FileSystem.readFileSync(Path.resolve(home, 'src', 'schema.yml'), 'utf8'),
  ),
);
const validateRequestSchema = ajv.getSchema('request');
const validateConfigurationDataSchema = ajv.getSchema('configuration-data');
const validateCLIOptionsSchema = ajv.getSchema('cli-options');

const makeValidate = (name, callback) => (json) => {
  if (!callback(json)) {
    logger.warning(`Invalid json for schema %s: %j`, name, callback.errors);
    assert(callback.errors.length > 0, `unexpected empty error array`);
    const error = callback.errors[0];
    return new Left(
      `invalid ${name} at ${error.schemaPath}, it ${
        error.message
      } (${JSON.stringify(error.params)})`,
    );
  }
  return new Right(json);
};

export const validateRequest = makeValidate('request', validateRequestSchema);

export const validateConfigurationData = makeValidate(
  'configuration-data',
  validateConfigurationDataSchema,
);

export const validateCLIOptions = makeValidate(
  'options',
  validateCLIOptionsSchema,
);
