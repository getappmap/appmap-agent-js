/* global APPMAP_GLOBAL_EMPTY_MARKER, APPMAP_GLOBAL_SERIALIZE_EXCEPTION */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/empty-marker.js');
load('src/es2015/serialize.js');
load('src/es2015/serialize-exception.js');
load('src/es2015/get-class-name.js');
load('src/es2015/get-identity.js');

Assert.deepEqual(
  APPMAP_GLOBAL_SERIALIZE_EXCEPTION(APPMAP_GLOBAL_EMPTY_MARKER),
  [],
);

Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_EXCEPTION(null), [
  {
    class: 'null',
    message: null,
    object_id: null,
    path: null,
    lineno: null,
  },
]);

const error = new Error('foo');

Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_EXCEPTION(error), [
  {
    class: 'Error',
    message: error.message,
    object_id: 1,
    path: error.stack,
    lineno: null,
  },
]);
