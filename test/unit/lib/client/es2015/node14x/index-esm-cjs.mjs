import protocol from './__fixture_protocol__.mjs';

process.env = {
  ...process.env,
  APPMAP_PROTOCOL: protocol,
};

import('../../../../../../lib/client/es2015/node14x/index-esm-cjs.js');
