process.env = {
  ...process.env,
  APPMAP_PROTOCOL: {
    request: (json) => null,
    requestAsync: (json, discarded) => Promise.resolve(null),
  },
};

import('../../../../../../lib/client/node/recorder/mocha-bin.js');
