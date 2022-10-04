const {
  URL,
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

const { search: __search } = new URL(import.meta.url);

const { identity, hasOwnProperty, incrementCounter, createCounter } =
  await import(`../../util/index.mjs${__search}`);
const { logDebug, logGuardDebug } = await import(
  `../../log/index.mjs${__search}`
);

const noargs = [];

const empty = symbolFor("APPMAP_EMPTY_MARKER");

const isSymbol = (any) => typeof any === "symbol";

const isString = (any) => typeof any === "string";

const wellknown = new Set(
  ownKeys(Symbol)
    .map((key) => Symbol[key])
    .filter(isSymbol),
);

////////////////////
// Reflect Helper //
////////////////////
const getOwnKeyArrayImpure = (object) => {
  try {
    return ownKeys(object);
  } catch (error) {
    logDebug(
      "Reflect.ownKeys(%o) threw %O (this should only happen when the object is a proxy)",
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
      "Reflect.getPrototypeOf(%o) threw %O (this should only happen when the object is a proxy)",
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
      "Reflect.getOwnPropertyDescriptor(%o, %j) threw %O (this should only happen when the object is a proxy)",
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
const getTypeTagPure = (any) => apply(toString, any, noargs);
const getTagPure = (any) => {
  const type_tag = getTypeTagPure(any);
  return type_tag.substring(type_tag.indexOf(" ") + 1, type_tag.length - 1);
};
const toStringImpure = (object) => {
  try {
    return object.toString();
  } catch (error) {
    logDebug("%o.toString() failure >> %O", object, error);
    return undefined;
  }
};
///////////
// Index //
///////////
const generateGetIndex =
  (name) =>
  ({ [name]: map, counter }, value) => {
    const index = map.get(value);
    if (index !== undefined) {
      return index;
    } else {
      const new_index = incrementCounter(counter);
      map.set(value, new_index);
      return new_index;
    }
  };
const getSymbolIndex = generateGetIndex("symbols");
const getReferenceIndex = generateGetIndex("references");
////////////////////////
// getConstructorName //
////////////////////////
const getConstructorName = ({ impure_constructor_naming }, object) => {
  if (impure_constructor_naming) {
    const _constructor = getDataPropertyImpure(object, "constructor");
    if (typeof _constructor === "function") {
      const name = getDataPropertyImpure(_constructor, "name");
      logGuardDebug(
        typeof name !== "string",
        "Constructor name of %o is not a string: %o",
        object,
        name,
      );
      return typeof name === "string" ? name : getTagPure(object);
    } else {
      return getTagPure(object);
    }
  } else {
    return getTagPure(object);
  }
};
///////////////
// stringify //
///////////////
const generatePrint =
  (printString) =>
  ({ impure_printing }, any) => {
    if (
      any === null ||
      any === undefined ||
      typeof any === "boolean" ||
      typeof any === "number"
    ) {
      return String(any);
    } else if (typeof any === "string") {
      return printString(any);
    } else if (typeof any === "bigint") {
      return `${String(any)}n`;
    } else if (typeof any === "symbol") {
      if (wellknown.has(any)) {
        return `well-known ${String(any)}`;
      } else if (keyFor(any) !== undefined) {
        return `global ${String(any)}`;
      } else {
        return String(any);
      }
    } else if (typeof any === "function") {
      if (impure_printing) {
        const name = getDataPropertyImpure(any, "name");
        if (getOwnPropertyDescriptorImpure(any, "prototype") !== undefined) {
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
      } else {
        return getTypeTagPure(any);
      }
    } else {
      if (impure_printing) {
        const representation = toStringImpure(any);
        logGuardDebug(
          typeof representation !== "string",
          "%o.toString() did not return a string, got: %o",
          any,
          representation,
        );
        return typeof representation === "string"
          ? representation
          : getTypeTagPure(any);
      } else {
        return getTypeTagPure(any);
      }
    }
  };
const print = generatePrint(stringifyJSON);
const show = generatePrint(identity);
//////////////////
// getSpecific  //
//////////////////
const getSpecific = (serialization, object) => {
  if (
    serialization.impure_error_inspection &&
    hasPrototypeImpure(object, error_prototype)
  ) {
    return {
      type: "error",
      name: show(serialization, getDataPropertyImpure(object, "name")),
      message: show(serialization, getDataPropertyImpure(object, "message")),
      stack: show(serialization, getDataPropertyImpure(object, "stack")),
    };
  } else if (serialization.impure_array_inspection && isArray(object)) {
    // Proxies cannot change array's length so we know it will be a number.
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
        getConstructorName(serialization, getDataPropertyImpure(object, key)),
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
  const representation = print(serialization, value);
  if (
    type === "null" ||
    type === "undefined" ||
    type === "boolean" ||
    type === "number" ||
    type === "string" ||
    type === "bigint"
  ) {
    return { type, print: representation };
  } else if (type === "symbol") {
    return {
      type,
      print: representation,
      index: getSymbolIndex(serialization, value),
    };
  } else {
    return {
      type,
      print: representation,
      index: getReferenceIndex(serialization, value),
      constructor: getConstructorName(serialization, value),
      specific: getSpecific(serialization, value),
    };
  }
};

export const createSerialization = ({
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
});

export const getSerializationEmptyValue = ({ empty }) => empty;

export const serialize = (serialization, value) => {
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
};
