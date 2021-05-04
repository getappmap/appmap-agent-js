import { strict as Assert } from 'assert';
import {checkVersion} from '../../../../../../../lib/client/es2015/node14x/plugin/check-version.js';

Assert.equal(checkVersion({ version: 'v14.0.0' }), undefined);

Assert.throws(
  () => checkVersion({ version: 'v10.0.0' }),
  /Error: incompatible node version/u,
);
