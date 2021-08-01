import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Serialization from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { createSerialization, getSerializationEmptyValue, serialize } =
    Serialization(dependencies);
  const setupSerialization = (config) =>
    createSerialization(
      extendConfiguration(createConfiguration("/cwd"), {
        serialization: config,
      }),
    );
  const testSerialize = (config, value) =>
    serialize(setupSerialization(config), value);
  const default_serial = {
    type: null,
    index: null,
    constructor: null,
    truncated: false,
    print: null,
    specific: null,
  };
  // empty //
  {
    const serialization = setupSerialization({});
    const empty = getSerializationEmptyValue(serialization);
    assertEqual(serialize(serialization, empty), null);
  }
  // number - string - bigint //
  assertDeepEqual(testSerialize({}, 123), {
    ...default_serial,
    type: "number",
    print: "123",
  });
  // overflow //
  assertDeepEqual(testSerialize({ "maximum-length": 50 }, ".".repeat(51)), {
    ...default_serial,
    type: "string",
    truncated: true,
    print: ".".repeat(50),
  });
  assertDeepEqual(testSerialize({ "maximum-length": null }, ".".repeat(51)), {
    ...default_serial,
    type: "string",
    truncated: false,
    print: ".".repeat(51),
  });
  // symbol //
  assertDeepEqual(testSerialize({}, Symbol("description")), {
    ...default_serial,
    type: "symbol",
    index: 1,
    print: "Symbol(description)",
  });
  {
    const serialization = setupSerialization({});
    const serial = {
      ...default_serial,
      type: "symbol",
      index: 1,
      print: "global Symbol(description)",
    };
    assertDeepEqual(
      serialize(serialization, Symbol.for("description")),
      serial,
    );
    assertDeepEqual(
      serialize(serialization, Symbol.for("description")),
      serial,
    );
  }
  assertDeepEqual(testSerialize({}, Symbol.iterator), {
    ...default_serial,
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
      ...default_serial,
      type: "object",
      index: 1,
      constructor: null,
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
      ...default_serial,
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
      ...default_serial,
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
      ...default_serial,
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
      ...default_serial,
      type: "object",
      index: 1,
      print: "[object Object]",
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
        ...default_serial,
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
};

testAsync();
