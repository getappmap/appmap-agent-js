import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Serialization from "./index.mjs";

const {
  Symbol,
  Error,
  Reflect: { defineProperty },
} = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const { validateSerial } = await buildTestComponentAsync("validate");

const { createSerialization, getSerializationEmptyValue, serialize } =
  Serialization(dependencies);

const setupSerialization = (config) =>
  createSerialization(
    extendConfiguration(createConfiguration("file:///home"), {
      serialization: config,
    }),
  );

const testSerialize = (config, value) =>
  serialize(setupSerialization(config), value);

///////////
// empty //
///////////

{
  const serialization = setupSerialization({});
  const empty = getSerializationEmptyValue(serialization);
  validateSerial(serialize(serialization, empty));
}

//////////
// null //
//////////

validateSerial(testSerialize({}, null));

/////////////
// boolean //
/////////////

validateSerial(testSerialize({}, true));

////////////
// number //
////////////

validateSerial(testSerialize({}, 123));

////////////
// bigint //
////////////

validateSerial(testSerialize({}, 123n));

////////////
// string //
////////////

validateSerial(testSerialize({ "maximum-print-length": 50 }, ".".repeat(100)));
validateSerial(
  testSerialize({ "maximum-print-length": null }, ".".repeat(100)),
);

////////////
// symbol //
////////////

validateSerial(testSerialize({}, Symbol("description")));

{
  const serialization = setupSerialization({});
  const serial1 = serialize(serialization, Symbol.for("description"));
  const serial2 = serialize(serialization, Symbol.for("description"));
  validateSerial(serial1);
  validateSerial(serial2);
  assertDeepEqual(serial1, serial2);
}

validateSerial(testSerialize({}, Symbol.iterator));

////////////
// object //
////////////

// object pure //
validateSerial(
  testSerialize(
    {
      "impure-printing": false,
      "impure-constructor-naming": false,
      "impure-hash-inspection": false,
    },
    /* eslint-disable prefer-rest-params */
    (function () {
      return arguments;
    })(),
    /* eslint-enable prefer-rest-params */
  ),
);

// object impure //
validateSerial(
  testSerialize(
    {
      "impure-hash-inspection": false,
    },
    {
      __proto__: null,
      toString: () => "PRINT",
      constructor: function CONSTRUCTOR() {},
    },
  ),
);

// object impure failing toString //
validateSerial(
  testSerialize(
    {
      "impure-hash-inspection": false,
    },
    {
      __proto__: null,
      toString: () => {
        throw new Error("BOUM");
      },
    },
  ),
);

// object impure invalid toString result //
validateSerial(
  testSerialize(
    {
      "impure-hash-inspection": false,
    },
    {
      __proto__: null,
      toString: () => 123,
    },
  ),
);

// object impure invalid constructor name //
{
  const closure = function () {};
  defineProperty(closure, "name", { __proto__: null, value: 123 });
  validateSerial(
    testSerialize(
      {
        "impure-hash-inspection": false,
      },
      {
        __proto__: null,
        constructor: closure,
      },
    ),
  );
}

/////////////
// closure //
/////////////

// function named //
validateSerial(testSerialize({}, function f() {}));

// function anonymous //
validateSerial(testSerialize({}, function () {}));

// arrow named //
validateSerial(testSerialize({}, { f: () => {} }.f));

// arrow anonymous //
validateSerial(testSerialize({}, () => {}));

///////////
// error //
///////////

validateSerial(
  testSerialize(
    {},
    {
      __proto__: Error.prototype,
      name: "name",
      message: "message",
      stack: "stack",
    },
  ),
);

// invalid message and getSafe recovery //
validateSerial(
  testSerialize(
    {},
    {
      __proto__: Error.prototype,
      name: 123,
      message: 456,
      get stack() {
        throw new Error("BOUM");
      },
    },
  ),
);

//////////
// hash //
//////////

validateSerial(
  testSerialize(
    {},
    {
      foo: 123,
      bar: 456,
    },
  ),
);

// hash toEntriesSafe recovery //
validateSerial(
  testSerialize(
    {},
    {
      get foo() {
        throw new Error("BOUM");
      },
    },
  ),
);

///////////
// array //
///////////

validateSerial(testSerialize({}, [123, 456]));
