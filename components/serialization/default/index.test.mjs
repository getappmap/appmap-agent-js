import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Serialization from "./index.mjs";

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
// number - string - bigint //
assertDeepEqual(testSerialize({}, 123), {
  type: "number",
  print: "123",
});
// overflow //
assertDeepEqual(testSerialize({ "maximum-length": 50 }, ".".repeat(51)), {
  type: "string",
  truncated: true,
  print: ".".repeat(50),
});
assertDeepEqual(testSerialize({ "maximum-length": null }, ".".repeat(51)), {
  type: "string",
  print: ".".repeat(51),
});
// symbol //
assertDeepEqual(testSerialize({}, Symbol("description")), {
  type: "symbol",
  index: 1,
  print: "Symbol(description)",
});
{
  const serialization = setupSerialization({});
  const serial = {
    type: "symbol",
    index: 1,
    print: "global Symbol(description)",
  };
  assertDeepEqual(serialize(serialization, Symbol.for("description")), serial);
  assertDeepEqual(serialize(serialization, Symbol.for("description")), serial);
}
assertDeepEqual(testSerialize({}, Symbol.iterator), {
  type: "symbol",
  index: 1,
  print: "well-known Symbol(Symbol.iterator)",
});
// object //
assertDeepEqual(
  testSerialize(
    {
      method: "Object.prototype.toString",
      "include-constructor-name": true,
    },
    {
      __proto__: { __proto__: null },
    },
  ),
  {
    constructor: null,
    type: "object",
    index: 1,
    print: "[object Object]",
  },
);
assertDeepEqual(
  testSerialize(
    {
      method: "Object.prototype.toString",
      "include-constructor-name": true,
    },
    {
      __proto__: {
        __proto__: null,
        constructor: { name: "constructor-name" },
      },
    },
  ),
  {
    type: "object",
    index: 1,
    constructor: "constructor-name",
    print: "[object Object]",
  },
);
assertDeepEqual(
  testSerialize(
    {
      method: "Object.prototype.toString",
      "include-constructor-name": true,
    },
    {
      __proto__: { __proto__: null, constructor: { name: 123 } },
    },
  ),
  {
    type: "object",
    index: 1,
    constructor: null,
    print: "[object Object]",
  },
);
// object (toString) //
assertDeepEqual(
  testSerialize(
    {
      method: "toString",
      "include-constructor-name": false,
    },
    {
      toString: () => "description",
    },
  ),
  {
    type: "object",
    index: 1,
    print: "description",
  },
);
assertDeepEqual(
  testSerialize(
    {
      method: "toString",
      "include-constructor-name": false,
    },
    {
      toString: () => {
        throw new Error("BOUM");
      },
    },
  ),
  {
    type: "object",
    index: 1,
    print: "[object Object]",
  },
);
assertDeepEqual(
  testSerialize(
    {
      method: "toString",
      "include-constructor-name": false,
    },
    {
      toString: () => 123,
    },
  ),
  {
    type: "object",
    index: 1,
    print: "[object Object]",
  },
);
// function (toString)
assertDeepEqual(
  testSerialize(
    {
      method: "toString",
      "include-constructor-name": false,
    },
    () => {},
  ),
  {
    type: "function",
    index: 1,
    print: "[object Function]",
  },
);
// specific: error //
{
  const error = new TypeError("message");
  const { stack } = error;
  assertDeepEqual(
    testSerialize(
      {
        "include-constructor-name": true,
        method: "toString",
      },
      error,
    ),
    {
      type: "object",
      constructor: "TypeError",
      index: 1,
      print: "TypeError: message",
      specific: {
        type: "error",
        stack,
        message: "message",
      },
    },
  );
}
