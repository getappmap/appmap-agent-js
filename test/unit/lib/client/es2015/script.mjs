/* global
  APPMAP_GLOBAL_EMPTY_MARKER
  APPMAP_GLOBAL_UNDEFINED
  APPMAP_GLOBAL_GET_NOW
  APPMAP_GLOBAL_EMIT
  APPMAP_PROCESS_ID
  APPMAP_GLOBAL_EVENT_COUNTER
  APPMAP_GLOBAL_GET_CLASS_NAME
  APPMAP_GLOBAL_GET_IDENTITY
  APPMAP_GLOBAL_SERIALIZE
  APPMAP_GLOBAL_SERIALIZE_EXCEPTION
  APPMAP_GLOBAL_SERIALIZE_PARAMETER */

import * as VirtualMachine from 'vm';
import * as FileSystem from 'fs';
import {strict as Assert} from 'assert';

const filename = 'lib/client/es2015/script.js';

VirtualMachine.runInThisContext(FileSystem.readFileSync(filename, 'utf8'), {
  filename
});

Assert.equal(typeof APPMAP_GLOBAL_EMPTY_MARKER, 'symbol');

Assert.equal(APPMAP_GLOBAL_UNDEFINED, undefined);

Assert.equal(typeof APPMAP_GLOBAL_GET_NOW(), 'number');

Assert.equal(APPMAP_GLOBAL_EMIT, undefined);

Assert.equal(typeof APPMAP_GLOBAL_EVENT_COUNTER, 'number');

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

{
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
}

Assert.equal(APPMAP_GLOBAL_SERIALIZE(APPMAP_GLOBAL_EMPTY_MARKER), 'empty');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(null), 'null');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(undefined), 'undefined');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(true), 'true');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(false), 'false');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(123), '123');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(123n), '123n');
Assert.equal(APPMAP_GLOBAL_SERIALIZE([]), '[object Array]');
Assert.equal(APPMAP_GLOBAL_SERIALIZE(`"'foo'"`), JSON.stringify(`"'foo'"`));

Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_PARAMETER(Symbol('foo'), 'pattern'), {
  class: 'symbol',
  name: 'pattern',
  object_id: 5,
  value: '[object Symbol]',
});

{
  const error = new Error('foo');
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
  Assert.deepEqual(APPMAP_GLOBAL_SERIALIZE_EXCEPTION(error), [
    {
      class: 'Error',
      message: error.message,
      object_id: 6,
      path: error.stack,
      lineno: null,
    },
  ]);
}
