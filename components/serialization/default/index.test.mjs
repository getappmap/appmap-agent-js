import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Serialization from "./index.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
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
// empty //
{
  const serialization = setupSerialization({});
  const empty = getSerializationEmptyValue(serialization);
  assertEqual(serialize(serialization, empty), null);
}
// null //
assertDeepEqual(testSerialize({}, null), {
  type: "null",
  print: "null",
});
// number //
assertDeepEqual(testSerialize({}, 123), {
  type: "number",
  print: "123",
});
// bigint //
assertDeepEqual(testSerialize({}, 123n), {
  type: "bigint",
  print: "123n",
});
// string with overflow //
assertDeepEqual(
  testSerialize({ "maximum-print-length": 50 }, ".".repeat(100)),
  {
    type: "string",
    print: `"${".".repeat(45)} ...`,
  },
);
assertDeepEqual(
  testSerialize({ "maximum-print-length": null }, ".".repeat(100)),
  {
    type: "string",
    print: `"${".".repeat(100)}"`,
  },
);
// symbol //
assertDeepEqual(testSerialize({}, Symbol("description")), {
  type: "symbol",
  print: "Symbol(description)",
  index: 1,
});
{
  const serialization = setupSerialization({});
  const serial = {
    type: "symbol",
    print: "global Symbol(description)",
    index: 1,
  };
  assertDeepEqual(serialize(serialization, Symbol.for("description")), serial);
  assertDeepEqual(serialize(serialization, Symbol.for("description")), serial);
}
assertDeepEqual(testSerialize({}, Symbol.iterator), {
  type: "symbol",
  print: "well-known Symbol(Symbol.iterator)",
  index: 1,
});
// object pure //
assertDeepEqual(
  testSerialize(
    {
      "impure-printing": false,
      "impure-constructor-naming": false,
      "impure-hash-inspection": false,
    },
    (function () {
      return arguments;
    })(),
  ),
  {
    type: "object",
    print: "[object Arguments]",
    index: 1,
    constructor: "Arguments",
    specific: null,
  },
);
// object impure //
assertDeepEqual(
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
  {
    type: "object",
    print: "PRINT",
    index: 1,
    constructor: "CONSTRUCTOR",
    specific: null,
  },
);
// object impure failing toString //
assertDeepEqual(
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
  {
    type: "object",
    print: "[object Object]",
    index: 1,
    constructor: null,
    specific: null,
  },
);
// object impure invalid toString result //
assertDeepEqual(
  testSerialize(
    {
      "impure-hash-inspection": false,
    },
    {
      __proto__: null,
      toString: () => 123,
    },
  ),
  {
    type: "object",
    print: "[object Object]",
    index: 1,
    constructor: null,
    specific: null,
  },
);
// object impure invalid constructor name //
{
  const closure = function () {};
  defineProperty(closure, "name", { __proto__: null, value: 123 });
  assertDeepEqual(
    testSerialize(
      {
        "impure-hash-inspection": false,
      },
      {
        __proto__: null,
        constructor: closure,
      },
    ),
    {
      type: "object",
      print: "[object Object]",
      index: 1,
      constructor: null,
      specific: null,
    },
  );
}
// function named //
assertDeepEqual(
  testSerialize({}, function f() {}),
  {
    type: "function",
    print: "function f (...) { ... }",
    index: 1,
    constructor: "Function",
    specific: null,
  },
);
// function anonymous //
assertDeepEqual(
  testSerialize({}, function () {}),
  {
    type: "function",
    print: "function (...) { ... }",
    index: 1,
    constructor: "Function",
    specific: null,
  },
);
// arrow named //
assertDeepEqual(testSerialize({}, { f: () => {} }.f), {
  type: "function",
  print: "f = (...) => { ... }",
  index: 1,
  constructor: "Function",
  specific: null,
});
// arrow anonymous //
assertDeepEqual(
  testSerialize({}, () => {}),
  {
    type: "function",
    print: "(...) => { ... }",
    index: 1,
    constructor: "Function",
    specific: null,
  },
);

// error //
assertDeepEqual(
  testSerialize(
    {},
    {
      __proto__: Error.prototype,
      message: "message",
      stack: "stack",
    },
  ),
  {
    type: "object",
    print: "Error: message",
    index: 1,
    constructor: "Error",
    specific: {
      type: "error",
      stack: "stack",
      message: "message",
    },
  },
);
// error invalid message and getSafe recovery //
assertDeepEqual(
  testSerialize(
    {},
    {
      __proto__: Error.prototype,
      message: 123,
      get stack() {
        throw new Error("BOUM");
      },
    },
  ),
  {
    type: "object",
    print: "Error: 123",
    index: 1,
    constructor: "Error",
    specific: {
      type: "error",
      stack: "",
      message: "",
    },
  },
);
// hash //
assertDeepEqual(
  testSerialize(
    {},
    {
      foo: 123,
      bar: 456,
    },
  ),
  {
    type: "object",
    print: "[object Object]",
    index: 1,
    constructor: "Object",
    specific: {
      type: "hash",
      length: 2,
      properties: [
        { name: "foo", class: "Number" },
        { name: "bar", class: "Number" },
      ],
    },
  },
);
// hash toEntriesSafe recovery //
assertDeepEqual(
  testSerialize(
    {},
    {
      get foo() {
        throw new Error("BOUM");
      },
    },
  ),
  {
    type: "object",
    print: "[object Object]",
    index: 1,
    constructor: "Object",
    specific: {
      type: "hash",
      length: 0,
      properties: [],
    },
  },
);
// array //
assertDeepEqual(testSerialize({}, [123, 456]), {
  type: "object",
  print: "123,456",
  index: 1,
  constructor: "Array",
  specific: {
    type: "array",
    length: 2,
  },
});

//
// assertDeepEqual(
//   testSerialize(
//     {
//       method: "Object.prototype.toString",
//       "include-constructor-name": true,
//     },
//     {
//       __proto__: { __proto__: null, constructor: { name: 123 } },
//     },
//   ),
//   {
//     type: "object",
//     index: 1,
//     constructor: null,
//     print: "[object Object]",
//   },
// );
// // object (toString) //
// assertDeepEqual(
//   testSerialize(
//     {
//       method: "toString",
//       "include-constructor-name": false,
//     },
//     {
//       toString: () => "description",
//     },
//   ),
//   {
//     type: "object",
//     index: 1,
//     print: "description",
//   },
// );
// assertDeepEqual(
//   testSerialize(
//     {
//       method: "toString",
//       "include-constructor-name": false,
//     },
//     {
//       toString: () => {
//         throw new Error("BOUM");
//       },
//     },
//   ),
//   {
//     type: "object",
//     index: 1,
//     print: "[object Object]",
//   },
// );
// assertDeepEqual(
//   testSerialize(
//     {
//       method: "toString",
//       "include-constructor-name": false,
//     },
//     {
//       toString: () => 123,
//     },
//   ),
//   {
//     type: "object",
//     index: 1,
//     print: "[object Object]",
//   },
// );
// // function (toString)
// assertDeepEqual(
//   testSerialize(
//     {
//       method: "toString",
//       "include-constructor-name": false,
//     },
//     () => {},
//   ),
//   {
//     type: "function",
//     index: 1,
//     print: "[object Function]",
//   },
// );
