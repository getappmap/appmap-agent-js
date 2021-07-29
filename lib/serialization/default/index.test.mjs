import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Serialization from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const testAsync = async () => {
  const {
    createSerialization,
    configureSerialization,
    getSerializationEmptyValue,
    serialize,
  } = Serialization(await buildTestAsync(import.meta));
  // primitive //
  {
    const serialization = createSerialization();
    configureSerialization(serialization, {
      serialization: {
        depth: 0,
        "maximum-property-count": null,
        "maximum-string-length": 50,
      },
    });
    const empty = getSerializationEmptyValue(serialization);
    assertEqual(serialize(serialization, empty), null);
    assertDeepEqual(serialize(serialization, 123), {
      type: "number",
      value: 123,
    });
    assertDeepEqual(serialize(serialization, "foo"), {
      type: "string",
      truncated: false,
      value: "foo",
    });
    assertDeepEqual(serialize(serialization, ".".repeat(51)), {
      type: "string",
      truncated: true,
      value: ".".repeat(50),
    });
    assertDeepEqual(serialize(serialization, 123n), {
      type: "bigint",
      print: "123",
    });
  }
  // symbol //
  {
    const serialization = createSerialization();
    configureSerialization(serialization, {
      serialization: {
        depth: 0,
        "maximum-property-count": null,
        "maximum-string-length": null,
      },
    });
    {
      const serialized_symbol = {
        type: "symbol",
        index: 1,
        description: "foo",
        key: "foo",
      };
      assertDeepEqual(
        serialize(serialization, Symbol.for("foo")),
        serialized_symbol,
      );
      assertDeepEqual(
        serialize(serialization, Symbol.for("foo")),
        serialized_symbol,
      );
    }
    assertDeepEqual(serialize(serialization, Symbol("foo")), {
      type: "symbol",
      index: 2,
      description: "foo",
      key: null,
    });
  }
  // regexp //
  {
    const serialization = createSerialization();
    configureSerialization(serialization, {
      serialization: {
        depth: 1,
        "maximum-property-count": null,
        "maximum-string-length": null,
      },
    });
    assertDeepEqual(serialize(serialization, /foo/u), {
      type: "object",
      index: 2,
      class: "RegExp",
      inspect: {
        prototype: {
          type: "object",
          index: 1,
          class: "RegExp",
          inspect: null,
          specific: null,
        },
        truncated: false,
        properties: { lastIndex: { type: "number", value: 0 } },
      },
      specific: { type: "regexp", source: "foo", flags: "u" },
    });
  }
  // error //
  {
    const serialization = createSerialization();
    configureSerialization(serialization, {
      serialization: {
        depth: 1,
        "maximum-property-count": 0,
        "maximum-string-length": null,
      },
    });
    const {
      specific: { stack, ...specific },
      ...data
    } = serialize(serialization, new Error("foo"));
    assertEqual(typeof stack, "string");
    assertDeepEqual(
      { specific, ...data },
      {
        specific: { type: "error", name: "Error", message: "foo" },
        type: "object",
        index: 2,
        class: "Error",
        inspect: {
          prototype: {
            type: "object",
            index: 1,
            class: "Error",
            inspect: null,
            specific: null,
          },
          truncated: true,
          properties: {},
        },
      },
    );
  }
  // object without class //
  {
    const serialization = createSerialization();
    configureSerialization(serialization, {
      serialization: {
        depth: 1,
        "maximum-property-count": null,
        "maximum-string-length": null,
      },
    });
    assertDeepEqual(serialize(serialization, { __proto__: null }), {
      type: "object",
      index: 1,
      class: null,
      inspect: {
        prototype: { type: "null" },
        truncated: false,
        properties: {},
      },
      specific: null,
    });
  }
};

testAsync();
