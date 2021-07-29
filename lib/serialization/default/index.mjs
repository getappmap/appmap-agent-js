const { getPrototypeOf, getOwnPropertyDescriptor, ownKeys } = Reflect;
const _Error = Error;
const _Symbol = Symbol;
const { keyFor } = Symbol;
const _WeakMap = WeakMap;
const _Map = Map;
const _RegExp = RegExp;
const _String = String;
const _undefined = undefined;
const { fromEntries } = Object;
// const { isArray } = Array;

export default (dependencies) => {
  const {
    util: { incrementCounter, createCounter, createBox, setBox, getBox },
  } = dependencies;
  const isString = (value) => typeof value === "string";
  const empty = _Symbol("empty");
  const cache = new Map([
    [empty, null],
    [null, { type: "null" }],
    [_undefined, { type: "undefined" }],
    [true, { type: "boolean", data: true }],
    [false, { type: "boolean", data: false }],
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
  const getClassName = (object) => {
    while (object !== null) {
      const descriptor1 = getOwnPropertyDescriptor(object, "constructor");
      if (descriptor1) {
        if (getOwnPropertyDescriptor(descriptor1, "value")) {
          const { value: constructor } = descriptor1;
          const descriptor2 = getOwnPropertyDescriptor(constructor, "name");
          if (descriptor2) {
            if (getOwnPropertyDescriptor(descriptor2, "value")) {
              const { value: name } = descriptor2;
              if (typeof name === "string") {
                return name;
              }
            }
          }
        }
      }
      object = getPrototypeOf(object);
    }
    return null;
  };
  const serialize = (serialization, depth, value) => {
    if (cache.has(value)) {
      return cache.get(value);
    }
    const type = typeof value;
    if (type === "number") {
      return {
        type,
        value: value,
      };
    }
    if (type === "bigint") {
      return {
        type,
        print: _String(value),
      };
    }
    if (type === "string") {
      const { conf } = serialization;
      const { maximum_string_length } = getBox(conf);
      const { length } = value;
      if (maximum_string_length !== null && length > maximum_string_length) {
        return {
          type,
          truncated: true,
          value: value.substring(0, maximum_string_length),
        };
      }
      return {
        type,
        truncated: false,
        value,
      };
    }
    if (type === "symbol") {
      const { counter, symbols } = serialization;
      const { description } = value;
      const key = keyFor(value);
      return {
        type,
        index: getIndex(symbols, counter, value),
        description,
        key: key === _undefined ? null : key,
      };
    }
    let specific = null;
    if (value instanceof _Error) {
      const { name, message, stack } = value;
      specific = { type: "error", name, message, stack };
    } else if (value instanceof _RegExp) {
      const { source, flags } = value;
      specific = { type: "regexp", source, flags };
    }
    let inspect = null;
    if (depth > 0) {
      const { conf } = serialization;
      const { maximum_property_count } = getBox(conf);
      let keys = ownKeys(value).filter(isString);
      const { length } = keys;
      let truncated = false;
      if (maximum_property_count !== null && length > maximum_property_count) {
        keys = keys.slice(0, maximum_property_count);
        truncated = true;
      }
      inspect = {
        prototype: serialize(serialization, 0, getPrototypeOf(value)),
        truncated,
        properties: fromEntries(
          keys.map((key) => [
            key,
            serialize(serialization, depth - 1, value[key]),
          ]),
        ),
      };
    }
    const { counter, references } = serialization;
    return {
      type,
      index: getIndex(references, counter, value),
      class: getClassName(value),
      inspect,
      specific,
    };
  };
  return {
    createSerialization: () => ({
      counter: createCounter(0),
      empty,
      symbols: new _Map(),
      references: new _WeakMap(),
      conf: createBox(null),
    }),
    configureSerialization: (
      { conf },
      {
        serialization: {
          depth,
          "maximum-string-length": maximum_string_length,
          "maximum-property-count": maximum_property_count,
        },
      },
    ) => {
      setBox(conf, {
        depth,
        maximum_string_length,
        maximum_property_count,
      });
    },
    getSerializationEmptyValue: ({ empty }) => empty,
    serialize: (serialization, value) => {
      const { conf } = serialization;
      const { depth } = getBox(conf);
      return serialize(serialization, depth, value);
    },
  };
};
