import protocol from './__fixture_protocol__.mjs';

process.env = {
  ...process.env,
  APPMAP_PROTOCOL: protocol,
};

import('../../../../../../lib/client/es2015/node/index-esm-cjs.js');
