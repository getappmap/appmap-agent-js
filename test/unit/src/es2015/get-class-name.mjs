/* global APPMAP_GLOBAL_GET_CLASS_NAME */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/get-class-name.js');

Assert.equal(APPMAP_GLOBAL_GET_CLASS_NAME(null), 'null');

Assert.equal(APPMAP_GLOBAL_GET_CLASS_NAME(123), 'number');

Assert.equal(APPMAP_GLOBAL_GET_CLASS_NAME(new Date()), 'Date');

Assert.equal(
  APPMAP_GLOBAL_GET_CLASS_NAME({
    get constructor() {
      return 'foo';
    },
  }),
  'Unknown',
);

Assert.equal(
  APPMAP_GLOBAL_GET_CLASS_NAME({
    constructor: {
      name: 123,
    },
  }),
  'Unknown',
);

Assert.equal(
  APPMAP_GLOBAL_GET_CLASS_NAME({
    constructor: {},
  }),
  'Unknown',
);

Assert.equal(
  APPMAP_GLOBAL_GET_CLASS_NAME({
    constructor: {
      get name() {
        return 'foo';
      },
    },
  }),
  'Unknown',
);
