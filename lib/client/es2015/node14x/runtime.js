/* eslint camelcase: ["error", {allow: ["object_id", "^global_"]}] */
/* eslint no-unused-vars: off */
/* eslint strict: off */
/* eslint prefer-const: off */

"use strict";

const global_Reflect_getOwnPropertyDescriptor =
  Reflect.getOwnPropertyDescriptor;
const global_Reflect_getPrototypeOf = Reflect.getPrototypeOf;
const global_Reflect_apply = Reflect.apply;
const global_WeakMap_prototype_has = WeakMap.prototype.has;
const global_WeakMap_prototype_get = WeakMap.prototype.get;
const global_WeakMap_prototype_set = WeakMap.prototype.set;
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
    if (
      !global_Reflect_apply(global_WeakMap_prototype_has, registery2, [value])
    ) {
      counter += 1;
      global_Reflect_apply(global_WeakMap_prototype_set, registery2, [
        value,
        counter,
      ]);
    }
    return global_Reflect_apply(global_WeakMap_prototype_get, registery2, [
      value,
    ]);
  }
  return null;
};

const serialize = (value) => {
  if (value === empty) {
    return "empty";
  }
  if (value === null) {
    return "null";
  }
  if (value === true) {
    return "true";
  }
  if (value === false) {
    return "false";
  }
  if (value === global_undefined) {
    return "undefined";
  }
  if (typeof value === "number") {
    return global_String(value);
  }
  if (typeof value === "bigint") {
    return `${global_String(value)}n`;
  }
  if (typeof value === "string") {
    return global_JSON_stringify(value);
  }
  return global_Reflect_apply(global_Object_prototype_toString, value, []);
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

const serializeParameter = (value, name) => ({
  name,
  object_id: getIdentity(value),
  class: getClassName(value),
  value: serialize(value),
});

const singleton = {
  __proto__: null,
  undefined: global_undefined,
  event: 0,
  getNow: global_Date_now,
  record: null,
  pid: null,
  empty,
  getClassName,
  getIdentity,
  serialize,
  serializeException,
  serializeParameter,
};

exports.getRuntime = () => singleton;
