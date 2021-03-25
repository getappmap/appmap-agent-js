/* global APPMAP_GLOBAL_SERIALIZE_EXCEPTION */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/empty-marker.js');
load('src/es2015/serialize.js');
load('src/es2015/serialize-exception.js');
load('src/es2015/get-class-name.js');
load('src/es2015/get-identity.js');

const error = new Error('foo');

Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_EXCEPTION(error), {
  class: 'TODO',
  message: error.message,
  object_id: 1,
  path: error.stack,
  lineno: null,
});

Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_EXCEPTION(null), {
  class: 'TODO',
  message: null,
  object_id: null,
  path: null,
  lineno: null,
});
