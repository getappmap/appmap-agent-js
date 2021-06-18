/* eslint camelcase: ["error", {allow: ["object_id", "thread_id", "event_counter", "^global_"]}] */
/* eslint no-unused-vars: off */
/* eslint strict: off */
/* eslint prefer-const: off */

"use strict";

const {print} = require("../../util/print.js");

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

const empty = global_Symbol("empty");

let counter = 0;
const registery1 = { __proto__: null };
const registery2 = new WeakMap();

const VALUE_MAX_SIZE = 100; // should be even
const VALUE_SEPARATOR = " ... ";

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

const getIdentity = (value) => {
  if (typeof value === "symbol") {
    if (!(value in registery1)) {
      counter += 1;
      registery1[value] = counter;
    }
    return registery1[value];
  }
  if (
    (typeof value === "object" && value !== null) ||
    typeof value === "function"
  ) {
    if (!registery2.has(value)) {
      counter += 1;
      registery2.set(value, counter);
    }
    return registery2.get(value);
  }
  return null;
};

const serialize = (value) => {
  if (value === empty) {
    return "empty";
  }
  return print(value);
};

const serializeException = (value) => {
  if (value === empty) {
    return [];
  }
  if (value instanceof global_Error) {
    return [
      {
        class: getClassName(value),
        message: value.message,
        object_id: getIdentity(value),
        path: value.stack,
        lineno: null,
      },
    ];
  }
  return [
    {
      class: getClassName(value),
      message: null,
      object_id: getIdentity(value),
      path: null,
      lineno: null,
    },
  ];
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

const serializeParameter = (value, name) => ({
  name,
  object_id: getIdentity(value),
  class: getClassName(value),
  value: truncate(serialize(value)),
});

exports.getRuntime = () => ({
  makeCouple: null,
  empty,
  getClassName,
  getIdentity,
  serializeException,
  serializeParameter,
});
