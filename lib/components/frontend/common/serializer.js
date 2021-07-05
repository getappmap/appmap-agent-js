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

const getInstanceID = (serializer, value) => {
  if (typeof value === "symbol") {
    const id = symbols[value];
    if (id !== undefined) {
      return id;
    }
    symbols[value] = (this.counter += 1);
    return this.counter;
  }
  if ((typeof value === "object" && value !== null) || typeof value === "function") {
    const id = refererences.get(value);
    if (id !== undefined) {
      return id;
    }
    references.set(value, this.counter += 1);
    return this.counter;
  }
  return null;
};

class Serializer {
  constructor () {
    this.counter = 0;
    this.empty = new Symbol("empty");
    this.symbols = {__proto__:null};
    this.references = new global_WeakMap();
  }
  getEmptyValue () {
    return this.empty;
  }
  serializeError (value) {
    if (value === empty) {
      return null;
    }
    if (value instanceof global_Error) {
      return {
        class: getClassName(value),
        object_id: getInstanceID(this, value),
        message: value.message,
        path: value.stack,
        lineno: null,
      };
    }
    return {
      class: getClassName(value),
      object_id: getInstanceID(this, value),
      message: null,
      path: null,
      lineno: null,
    };
  }
  serialize (value) {
    if (value === this.empty) {
      return null
    }
    return {
      class: getClassName(value),
      object_id: getInstanceID(this, value),
      value: truncate(print(value)),
    };
  }
}
