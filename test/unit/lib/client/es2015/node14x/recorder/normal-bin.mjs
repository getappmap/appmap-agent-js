process.env = {
  ...process.env,
  APPMAP_PROTOCOL: {
    request: (json) => null,
    requestAsync: (json, discarded) => Promise.resolve(null),
  },
};

import('../../../../../../../lib/client/es2015/node14x/recorder/normal-bin.js');
