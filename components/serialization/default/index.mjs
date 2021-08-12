const { getPrototypeOf, apply, ownKeys } = Reflect;
const _Error = Error;
const _Infinity = Infinity;
const _Symbol = Symbol;
const { keyFor, for: symbolFor } = Symbol;
const _WeakMap = WeakMap;
const _Map = Map;
const _Set = Set;
const _String = String;
const _undefined = undefined;
const { prototype } = Object;
const { toString } = prototype;
// const { isArray } = Array;

const noargs = [];

export default (dependencies) => {
  const {
    util: { assert, hasOwnProperty, coalesce, incrementCounter, createCounter },
    log: { logWarning },
  } = dependencies;
  const empty = symbolFor("APPMAP_EMPTY_MARKER");
  const wellknown = new _Set(
    ownKeys(_Symbol)
      .map((key) => _Symbol[key])
      .filter((value) => typeof value === "symbol"),
  );
  const cache = new _Map([
    [empty, null],
    [null, { type: "null", print: "null" }],
    [_undefined, { type: "undefined", print: "undefined" }],
    [true, { type: "boolean", print: "true" }],
    [false, { type: "boolean", print: "false" }],
  ]);
  const getIndex = (map, counter, value) => {
    const index = map.get(value);
    if (index !== _undefined) {
      return index;
    }
    const new_index = incrementCounter(counter);
    map.set(value, new_index);
    return new_index;
  };
  const getConstructorName = (object) => {
    while (object !== null) {
      if (hasOwnProperty(object, "constructor")) {
        const name = coalesce(
          coalesce(object, "constructor", null),
          "name",
          null,
        );
        if (typeof name === "string") {
          return name;
        }
        logWarning("failed to extract constructor name from %o", object);
        return null;
      }
      object = getPrototypeOf(object);
    }
    return null;
  };
  return {
    createSerialization: ({
      serialization: {
        "maximum-length": maximum_length,
        "include-constructor-name": include_constructor_name,
        method,
      },
    }) => ({
      counter: createCounter(0),
      empty,
      symbols: new _Map(),
      references: new _WeakMap(),
      method,
      maximum_length: maximum_length === null ? _Infinity : maximum_length,
      include_constructor_name,
    }),
    getSerializationEmptyValue: ({ empty }) => empty,
    serialize: (
      {
        counter,
        symbols,
        references,
        maximum_length,
        include_constructor_name,
        method,
      },
      value,
    ) => {
      if (cache.has(value)) {
        return cache.get(value);
      }
      const type = typeof value;
      const serial = { __proto__: null, type };
      if (type === "number" || type === "bigint" || type === "string") {
        serial.print = _String(value);
      } else if (type === "symbol") {
        let prefix = "";
        if (wellknown.has(value)) {
          prefix = "well-known ";
        } else {
          const key = keyFor(value);
          if (key !== _undefined) {
            prefix = "global ";
          }
        }
        serial.index = getIndex(symbols, counter, value);
        serial.print = `${prefix}${_String(value)}`;
      } else {
        assert(type === "function" || type === "object", "invalid type");
        if (value instanceof _Error) {
          const { stack, message } = value;
          serial.specific = { type: "error", stack, message };
        }
        serial.index = getIndex(references, counter, value);
        if (method === "toString") {
          if (typeof value === "function") {
            serial.print = apply(toString, value, noargs);
          } else {
            try {
              serial.print = value.toString();
            } catch (error) {
              logWarning("%o.toString() failed with %e", value, error);
              serial.print = apply(toString, value, noargs);
            }
          }
        } else {
          assert(
            method === "Object.prototype.toString",
            "invalid serialization method",
          );
          serial.print = apply(toString, value, noargs);
        }
        if (include_constructor_name) {
          serial.constructor = getConstructorName(value);
        }
      }
      const { print } = serial;
      const { length } = print;
      if (length > maximum_length) {
        serial.print = print.substring(0, maximum_length);
        serial.truncated = true;
      }
      return { ...serial };
    },
  };
};
