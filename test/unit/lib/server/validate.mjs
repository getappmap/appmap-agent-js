import { strict as Assert } from 'assert';
import {
  validateRequest,
  validateConfiguration,
} from '../../../../lib/server/validate.mjs';

Assert.ok(
  validateRequest({ name: 'foo' }).fromLeft().startsWith('invalid request'),
);

Assert.deepEqual(
  validateConfiguration({ cwd: '/', 'app-name': 'foo' }).fromRight(),
  {
    cwd: '/',
    'app-name': 'foo',
  },
);

// Assert.deepEqual(validateCLIOptions({ port: 0 }).fromRight(), {port:0});