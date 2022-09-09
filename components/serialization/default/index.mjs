const {
  Reflect: { getPrototypeOf, apply, ownKeys },
  Error,
  Infinity,
  Symbol,
  Symbol: { keyFor, for: symbolFor },
  WeakMap,
  Map,
  Set,
  String,
  undefined,
  Object: {
    prototype: object_prototype,
    prototype: { toString },
    entries: toEntries,
    fromEntries,
  },
  Array: { isArray },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const noargs = [];

export default (dependencies) => {
  const {
    util: { incrementCounter, createCounter },
    log: { logDebug, logGuardDebug },
  } = dependencies;
  const toEntriesSafe = (object) => {
    try {
      return toEntries(object);
    } catch (error) {
      logDebug("Failed to called Object.entries on %o >> %e", object, error);
      return [];
    }
  };
  const getSafe = (object, key) => {
    try {
      return object[key];
    } catch (error) {
      logDebug("Failed to lookup %j on %o >> %e", key, object, error);
      return undefined;
    }
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
      const name = getSafe(value, "name");
      logGuardDebug(
        name !== "string",
        "Name of function %o is not a string: %o",
        value,
        name,
      );
      if (getSafe(value, "prototype") !== undefined) {
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
    const _constructor = getSafe(object, "constructor");
    if (typeof _constructor === "function") {
      const name = getSafe(_constructor, "name");
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
  const isEntryString = ({ 0: key }) => typeof key === "string";
  const serializeEntry = ({ 0: key, 1: value }) => [
    key,
    getConstructorNamePure(value),
  ];
  const getSpecific = (serialization, object) => {
    if (serialization.impure_error_inspection && object instanceof Error) {
      const name = getSafe(object, "name");
      const message = getSafe(object, "message");
      const stack = getSafe(object, "stack");
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
        name: typeof name === "string" ? name : "",
        message: typeof message === "string" ? message : "",
        stack: typeof stack === "string" ? stack : "",
      };
    } else if (serialization.impure_array_inspection && isArray(object)) {
      return { type: "array", length: getSafe(object, "length") };
    } else if (
      serialization.impure_hash_inspection &&
      (getPrototypeOf(object) === null ||
        getPrototypeOf(object) === object_prototype)
    ) {
      const entries = toEntriesSafe(object);
      return {
        type: "hash",
        length: entries.length,
        properties: fromEntries(
          entries
            .filter(isEntryString)
            .slice(0, serialization.maximum_properties_length)
            .map(serializeEntry),
        ),
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
