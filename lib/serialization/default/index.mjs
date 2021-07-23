const { getPrototypeOf, getOwnPropertyDescriptor } = Reflect;
const _Error = Error;
const _Symbol = Symbol;
const { keyFor } = Symbol;
const _WeakMap = WeakMap;
const _Map = Map;
const _RegExp = RegExp;
const _String = String;
const _undefined = undefined;
const { isArray } = Array;

export default (dependencies) => {
  const {
    util: { assert, coalesce, incrementCounter, createCounter },
  } = dependencies;
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
  return {
    createSerialization: (options) => ({
      maximum: coalesce(options, "serialization-maximum-string-length", 100),
      counter: createCounter(0),
      empty,
      symbols: new _Map(),
      references: new _WeakMap(),
    }),
    getSerializationEmptyValue: ({ empty }) => empty,
    serialize: (serialization, value) => {
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
        const { maximum } = serialization;
        const { length } = value;
        if (length > maximum) {
          return {
            type: "string",
            truncated: true,
            value: value.substring(0, maximum),
          };
        }
        return {
          type: "string",
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
      const { counter, references } = serialization;
      const index = getIndex(references, counter, value);
      const _class = getClassName(value);
      if (type === "function") {
        const { name, length } = value;
        return {
          type,
          class: _class,
          index,
          name,
          length,
        };
      }
      if (isArray(value)) {
        const { length } = value;
        return {
          type: "array",
          class: _class,
          index,
          length,
        };
      }
      if (value instanceof _Error) {
        const { name, message, stack } = value;
        return {
          type: "error",
          class: _class,
          index,
          name,
          message,
          stack,
        };
      }
      if (value instanceof _RegExp) {
        const { source, flags } = value;
        return {
          type: "regexp",
          class: _class,
          index,
          source,
          flags,
        };
      }
      assert(type === "object", "invalid value type");
      return {
        type,
        class: _class,
        index,
      };
    },
  };
};
