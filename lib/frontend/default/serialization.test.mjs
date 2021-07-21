import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Serialization from "./serialization.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { createSerialization, getSerializationEmptyValue, serialize } =
    Serialization(await buildAsync({ util: "default" }));
  const serialization = createSerialization();
  const empty = getSerializationEmptyValue(serialization);
  let counter = 0;
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
  assertDeepEqual(serialize(serialization, ".".repeat(101)), {
    type: "string",
    truncated: true,
    value: ".".repeat(100),
  });
  assertDeepEqual(serialize(serialization, 123n), {
    type: "bigint",
    print: "123",
  });
  {
    const serialized_symbol = {
      type: "symbol",
      index: (counter += 1),
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
    index: (counter += 1),
    description: "foo",
    key: null,
  });
  assertDeepEqual(
    serialize(serialization, function f(x1, x2, x3) {}),
    {
      type: "function",
      class: "Function",
      index: (counter += 1),
      name: "f",
      length: 3,
    },
  );
  assertDeepEqual(serialize(serialization, /foo/g), {
    type: "regexp",
    class: "RegExp",
    index: (counter += 1),
    source: "foo",
    flags: "g",
  });
  {
    const { stack, ...rest } = serialize(serialization, new Error("foo"));
    assertEqual(typeof stack, "string");
    assertDeepEqual(rest, {
      type: "error",
      class: "Error",
      index: (counter += 1),
      name: "Error",
      message: "foo",
    });
  }
  assertDeepEqual(serialize(serialization, [1, 2, 3]), {
    type: "array",
    class: "Array",
    index: (counter += 1),
    length: 3,
  });
  assertDeepEqual(serialize(serialization, { __proto__: null }), {
    type: "object",
    class: null,
    index: (counter += 1),
  });
};

mainAsync();
