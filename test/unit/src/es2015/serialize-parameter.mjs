/* global APPMAP_GLOBAL_SERIALIZE_PARAMETER */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/empty-marker.js');
load('src/es2015/serialize.js');
load('src/es2015/serialize-parameter.js');
load('src/es2015/get-class-name.js');
load('src/es2015/get-identity.js');

Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_PARAMETER(Symbol('foo'), 'pattern'), {
  class: 'TODO',
  name: 'pattern',
  object_id: 1,
  value: '[object Symbol]',
});
