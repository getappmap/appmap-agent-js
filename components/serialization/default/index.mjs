const {
  Reflect: { getOwnPropertyDescriptor, getPrototypeOf, apply, ownKeys },
  Error: { prototype: error_prototype },
  Infinity,
  Symbol,
  Symbol: { keyFor, for: symbolFor },
  WeakMap,
  Map,
  Set,
  String,
  undefined,
  Math: { min },
  Object: {
    prototype: object_prototype,
    prototype: { toString },
    fromEntries,
  },
  Array: { isArray },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const noargs = [];

export default (dependencies) => {
  const {
    util: { hasOwnProperty, incrementCounter, createCounter },
    log: { logDebug, logGuardDebug },
  } = dependencies;
  const getOwnKeyArrayImpure = (object) => {
    try {
      return ownKeys(object);
    } catch (error) {
      logDebug(
        "Reflect.ownKeys(%o) threw %e (this should only happen when the object is a proxy)",
        object,
        error,
      );
      return [];
    }
  };
  const getPrototypeImpure = (object) => {
    try {
      return getPrototypeOf(object);
    } catch (error) {
      logDebug(
        "Reflect.getPrototypeOf(%o) threw %e (this should only happen when the object is a proxy)",
        object,
        error,
      );
      return null;
    }
  };
  const getOwnPropertyDescriptorImpure = (object, key) => {
    try {
      return getOwnPropertyDescriptor(object, key);
    } catch (error) {
      logDebug(
        "Reflect.getOwnPropertyDescriptor(%o, %j) threw %e (this should only happen when the object is a proxy)",
        object,
        key,
        error,
      );
      return undefined;
    }
  };
  const hasPrototypeImpure = (object, prototype) => {
    while (object !== null) {
      if (object === prototype) {
        return true;
      }
      object = getPrototypeImpure(object);
    }
    return false;
  };
  const getDataPropertyImpure = (object, key) => {
    while (object !== null) {
      const descriptor = getOwnPropertyDescriptorImpure(object, key);
      if (descriptor !== undefined && hasOwnProperty(descriptor, "value")) {
        return descriptor.value;
      }
      object = getPrototypeImpure(object);
    }
    return undefined;
  };
  const empty = symbolFor("APPMAP_EMPTY_MARKER");
  const wellknown = new Set(
    ownKeys(Symbol)
      .map((key) => Symbol[key])
      .filter((value) => typeof value === "symbol"),
  );
  const printPureFallback = (value) => apply(toString, value, noargs);
  const printPure = (value) => {
    if (
      value === null ||
      value === undefined ||
      typeof value === "boolean" ||
      typeof value === "number"
    ) {
      return String(value);
    } else if (typeof value === "string") {
      return stringifyJSON(value);
    } else if (typeof value === "bigint") {
      return `${String(value)}n`;
    } else if (typeof value === "symbol") {
      if (wellknown.has(value)) {
        return `well-known ${String(value)}`;
      } else if (keyFor(value) !== undefined) {
        return `global ${String(value)}`;
      } else {
        return String(value);
      }
    } else {
      return printPureFallback(value);
    }
  };
  const printImpure = (value) => {
    if (typeof value === "function") {
      const name = getDataPropertyImpure(value, "name");
      logGuardDebug(
        name !== "string",
        "Name of function %o is not a string: %o",
        value,
        name,
      );
      if (getDataPropertyImpure(value, "prototype") !== undefined) {
        if (typeof name === "string" && name !== "") {
          return `function ${name} (...) { ... }`;
        } else {
          return `function (...) { ... }`;
        }
      } else {
        if (typeof name === "string" && name !== "") {
          return `${name} = (...) => { ... }`;
        } else {
          return `(...) => { ... }`;
        }
      }
    } else if (typeof value === "object" && value !== null) {
      let print = null;
      try {
        print = value.toString();
      } catch (error) {
        logDebug("%o.toString() failure >> %O", value, error);
        return printPureFallback(value);
      }
      if (typeof print !== "string") {
        logDebug("%o.toString() returned a non-string: %o", value, print);
        return printPureFallback(value);
      } else {
        return print;
      }
    } else {
      return printPure(value);
    }
  };
  const getIndex = (map, counter, value) => {
    const index = map.get(value);
    if (index !== undefined) {
      return index;
    } else {
      const new_index = incrementCounter(counter);
      map.set(value, new_index);
      return new_index;
    }
  };
  const getConstructorNameImpure = (object) => {
    const _constructor = getDataPropertyImpure(object, "constructor");
    if (typeof _constructor === "function") {
      const name = getDataPropertyImpure(_constructor, "name");
      logGuardDebug(
        typeof name !== "string",
        "Constructor name of %o is not a string: %o",
        object,
        name,
      );
      return typeof name === "string" ? name : null;
    } else {
      return null;
    }
  };
  const getConstructorNamePure = (value) => {
    const tag = printPureFallback(value);
    return tag.substring(tag.indexOf(" ") + 1, tag.length - 1);
  };
  const isString = (any) => typeof any === "string";
  const getSpecific = (serialization, object) => {
    if (
      serialization.impure_error_inspection &&
      hasPrototypeImpure(object, error_prototype)
    ) {
      const name = getDataPropertyImpure(object, "name");
      const message = getDataPropertyImpure(object, "message");
      const stack = getDataPropertyImpure(object, "stack");
      logGuardDebug(
        typeof name !== "string",
        "Name of error %o is not a string: %o",
        object,
        name,
      );
      logGuardDebug(
        typeof message !== "string",
        "Message of error %o is not a string: %o",
        object,
        message,
      );
      logGuardDebug(
        typeof stack !== "string",
        "Stack of error %o is not a string: %o",
        object,
        stack,
      );
      return {
        type: "error",
        name: typeof name === "string" ? name : printPure(name),
        message: typeof message === "string" ? message : printPure(name),
        stack: typeof stack === "string" ? stack : printPure(name),
      };
    } else if (serialization.impure_array_inspection && isArray(object)) {
      return { type: "array", length: getDataPropertyImpure(object, "length") };
    } else if (
      serialization.impure_hash_inspection &&
      (getPrototypeImpure(object) === null ||
        getPrototypeImpure(object) === object_prototype)
    ) {
      const keys = getOwnKeyArrayImpure(object).filter(isString);
      const entries = [];
      const length = min(keys.length, serialization.maximum_properties_length);
      for (let index = 0; index < length; index += 1) {
        const key = keys[index];
        entries.push([
          key,
          getConstructorNamePure(getDataPropertyImpure(object, key)),
        ]);
      }
      return {
        type: "hash",
        length,
        properties: fromEntries(entries),
      };
    } else {
      return null;
    }
  };
  const serializeNonEmpty = (serialization, value) => {
    const type = value === null ? "null" : typeof value;
    const print = serialization.impure_printing
      ? printImpure(value)
      : printPure(value);
    if (
      type === "null" ||
      type === "undefined" ||
      type === "boolean" ||
      type === "number" ||
      type === "string" ||
      type === "bigint"
    ) {
      return { type, print };
    } else if (type === "symbol") {
      return {
        type,
        print,
        index: getIndex(serialization.symbols, serialization.counter, value),
      };
    } else {
      return {
        type,
        print,
        index: getIndex(serialization.references, serialization.counter, value),
        constructor: serialization.impure_constructor_naming
          ? getConstructorNameImpure(value)
          : getConstructorNamePure(value),
        specific: getSpecific(serialization, value),
      };
    }
  };
  return {
    createSerialization: ({
      serialization: {
        "maximum-print-length": maximum_print_length,
        "maximum-properties-length": maximum_properties_length,
        "impure-printing": impure_printing,
        "impure-constructor-naming": impure_constructor_naming,
        "impure-array-inspection": impure_array_inspection,
        "impure-error-inspection": impure_error_inspection,
        "impure-hash-inspection": impure_hash_inspection,
      },
    }) => ({
      counter: createCounter(0),
      empty,
      symbols: new Map(),
      references: new WeakMap(),
      maximum_print_length:
        maximum_print_length === null ? Infinity : maximum_print_length,
      maximum_properties_length,
      impure_printing,
      impure_constructor_naming,
      impure_array_inspection,
      impure_error_inspection,
      impure_hash_inspection,
    }),
    getSerializationEmptyValue: ({ empty }) => empty,
    serialize: (serialization, value) => {
      if (value === serialization.empty) {
        return null;
      } else {
        const serial = serializeNonEmpty(serialization, value);
        if (serial.print.length > serialization.maximum_print_length) {
          return {
            ...serial,
            print: `${serial.print.substring(
              0,
              serialization.maximum_print_length - 4,
            )} ...`,
          };
        } else {
          return serial;
        }
      }
    },
  };
};
