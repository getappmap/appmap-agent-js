// https://github.com/ajv-validator/ajv/blob/master/docs/standalone.md

import Ajv from 'ajv';
import YAML from 'yaml';
import * as FileSystem from 'fs';
/* eslint-disable import/extensions */
import makeStandaloneCode from 'ajv/dist/standalone/index.js';
/* eslint-enable import/extensions */

const ajv = new Ajv({ code: { source: true } });

ajv.addSchema(YAML.parse(FileSystem.readFileSync(`src/schema.yml`, 'utf8')));

FileSystem.writeFileSync(
  'dist/schema.js',
  makeStandaloneCode.default(ajv),
  'utf8',
);
