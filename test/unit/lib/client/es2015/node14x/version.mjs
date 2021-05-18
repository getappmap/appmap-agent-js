import { strict as Assert } from 'assert';
import { setExitForTesting } from '../../../../../../lib/client/es2015/node14x/check.js';
import { expectVersion } from '../../../../../../lib/client/es2015/node14x/version.js';

setExitForTesting((code) => {
  throw new Error(code);
});

Assert.equal(expectVersion('foo', '1.2.3', '1.2.3'), null);

Assert.equal(expectVersion('foo', '2.0', '1.9'), null);

Assert.equal(expectVersion('foo', '1.2.3', '1.2'), null);
