import {strict as Assert} from "assert";
import {parseConfigurationData} from '../../../../../../../lib/client/es2015/node14x/recorder/env.js';

Assert.throws(
  () => parseConfigurationData({
    APPMAP_FOO: "TruE"
  }),
  /^Error: invalid appmap environment variable/
);

Assert.deepEqual(
  parseConfigurationData({
    APPMAP: "TruE"
  }),
  {
    __proto__: null,
    enabled: true,
  },
);

Assert.deepEqual(
  parseConfigurationData({
    APPMAP: "FalsE"
  }),
  {

      __proto__: null,
      enabled: false,
  }
);

Assert.deepEqual(
  parseConfigurationData({
    APPMAP: " foo , bar , qux "
  }),
   {
      __proto__: null,
      enabled: ['foo', 'bar', 'qux'],
    }
);

Assert.deepEqual(
  parseConfigurationData({
    APPMAP_CLASS_MAP_PRUNING: "TruE",
    APPMAP_EVENTS_PRUNING: "foo"
  }),
  {
      __proto__: null,
      "class-map-pruning": true,
      "events-pruning": false
    }
  );

Assert.deepEqual(
  parseConfigurationData({
    APPMAP_APP_NAME: "foo"
  }),
  {
    __proto__: null,
    "app-name": "foo",
  },
);
