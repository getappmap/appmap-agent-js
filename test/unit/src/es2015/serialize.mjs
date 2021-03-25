/* global APPMAP_GLOBAL_SERIALIZE, APPMAP_GLOBAL_EMPTY_MARKER */

import { strict as Assert } from 'assert';
import { load } from '../__fixture__.mjs';

load('src/es2015/empty-marker.js');
load('src/es2015/serialize.js');

Assert.equal(APPMAP_GLOBAL_SERIALIZE(APPMAP_GLOBAL_EMPTY_MARKER), 'empty');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(null), 'null');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(undefined), 'undefined');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(true), 'true');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(false), 'false');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(123), '123');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(123n), '123n');
Assert.equal(APPMAP_GLOBAL_SERIALIZE([]), '[object Array]');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(`"'foo'"`), JSON.stringify(`"'foo'"`));
