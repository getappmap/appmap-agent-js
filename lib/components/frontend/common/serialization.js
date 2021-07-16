/* eslint camelcase: ["error", {allow: ["object_id", "thread_id", "event_counter", "^global_"]}] */
/* eslint no-unused-vars: off */
/* eslint strict: off */
/* eslint prefer-const: off */

"use strict";

const {print} = require("../../../util/index.mjs");

const global_Reflect_getOwnPropertyDescriptor =
  Reflect.getOwnPropertyDescriptor;
const global_Reflect_getPrototypeOf = Reflect.getPrototypeOf;
const global_Reflect_apply = Reflect.apply;
const global_undefined = undefined;
const global_String = String;
const global_JSON_stringify = JSON.stringify;
const global_Object_prototype_toString = Object.prototype.toString;
const global_Error = Error;
const global_Date_now = Date.now;
const global_Symbol = Symbol;

const VALUE_MAX_FIRST_HALF_SIZE = 50
const VALUE_SEPARATOR = " ... ";
const VALUE_MAX_SIZE = 2 * VALUE_MAX_FIRST_HALF_SIZE;
const VALUE_MAX_SECOND_HALF_SIZE = VALUE_MAX_FIRST_HALF_SIZE - VALUE_SEPARATOR.length;

const getClassName = (value) => {
  if (typeof value === "object" || typeof value === "function") {
    let object = value;
    while (object !== null) {
      const descriptor1 = global_Reflect_getOwnPropertyDescriptor(
        object,
        "constructor"
      );
      if (descriptor1) {
        if (global_Reflect_getOwnPropertyDescriptor(descriptor1, "value")) {
          const constructor = descriptor1.value;
          const descriptor2 = global_Reflect_getOwnPropertyDescriptor(
            constructor,
            "name"
          );
          if (descriptor2) {
            if (global_Reflect_getOwnPropertyDescriptor(descriptor2, "value")) {
              const name = descriptor2.value;
              if (typeof name === "string") {
                return `${name}`;
              }
            }
          }
        }
        return "Unknown";
      }
      object = global_Reflect_getPrototypeOf(object);
    }
    return "null";
  }
  return typeof value;
};

const truncate = (string) => {
  if (string.length > VALUE_MAX_SIZE) {
    string = `${
      string.substring(0, VALUE_MAX_SIZE / 2)
    }${
      VALUE_SEPARATOR
    }${
      string.substring(string.length - (VALUE_MAX_SIZE / 2 - VALUE_SEPARATOR.length))
    }`;
  }
  return string;
};

const getInstanceIndex = ({symbols, references, counter}, value) => {
  if (typeof value === "symbol") {
    const id = symbols[value];
    if (id !== undefined) {
      return id;
    }
    return symbols[value] = incrementCounter(counter);
  }
  if ((typeof value === "object" && value !== null) || typeof value === "function") {
    const id = refererences.get(value);
    if (id !== undefined) {
      return id;
    }
    const new_id = incrementCounter(counter);
    references.set(value, new_id);
    return new_id;
  }
  return null;
};

export const serialize = (serialization, value) => {
  const {empty} = serialization;
  if (value === empty) {
    return null
  }
  return {
    class: getClassName(value),
    object_id: getInstanceIndex(serialization, value),
    value: truncate(print(value)),
  };
}

export const serializeError = (serialization, value) => {
  const {empty} = serialization;
  if (value === empty) {
    return null;
  }
  if (value instanceof global_Error) {
    return {
      class: getClassName(value),
      object_id: getInstanceIndex(serialization, value),
      message: value.message,
      path: value.stack,
      lineno: null,
    };
  }
  return {
    class: getClassName(value),
    object_id: getInstanceIndex(serialization, value),
    message: null,
    path: null,
    lineno: null,
  };
};

export const getSerializationEmptyValue = ({empty}) => empty;

export const createSerialization = () => ({
  counter: createCounter(0),
  empty: new global_Symbol("empty"),
  symbols: {__proto__:null},
  references: new global_WeakMap(),
});
