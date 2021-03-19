/* global APPMAP_GLOBAL_GET_IDENTITY */

import { strict as Assert } from 'assert';
import load from '../fixture-load.mjs';

load('src/es2015/get-identity.js');

const object1 = {};
const object2 = function f() {};
const symbol1 = Symbol('foo');
const symbol2 = Symbol('bar');

Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(123), null);

Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(object1), 1);
Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(symbol1), 2);
Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(object2), 3);
Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(symbol2), 4);

Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(object1), 1);
Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(symbol1), 2);
Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(object2), 3);
Assert.equal(APPMAP_GLOBAL_GET_IDENTITY(symbol2), 4);
