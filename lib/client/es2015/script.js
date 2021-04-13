/* eslint camelcase: ["error", {allow: ["object_id", "^global_"]}] */
/* eslint no-unused-vars: off */
/* eslint strict: off */
/* eslint prefer-const: off */

"use strict";

let APPMAP_GLOBAL_EMPTY_MARKER = Symbol("empty");

let APPMAP_GLOBAL_UNDEFINED;

let APPMAP_GLOBAL_GET_NOW = Date.now;

let APPMAP_GLOBAL_EMIT;

let APPMAP_GLOBAL_PROCESS_ID;

/* eslint-disable prefer-const */
let APPMAP_GLOBAL_EVENT_COUNTER = 0;
/* eslint-enable prefer-const */

let APPMAP_GLOBAL_GET_CLASS_NAME;
{
  const global_Reflect_getOwnPropertyDescriptor =
    Reflect.getOwnPropertyDescriptor;
  const global_Reflect_getPrototypeOf = Reflect.getPrototypeOf;
  APPMAP_GLOBAL_GET_CLASS_NAME = (value) => {
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
              if (
                global_Reflect_getOwnPropertyDescriptor(descriptor2, "value")
              ) {
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
}

let APPMAP_GLOBAL_GET_IDENTITY;
{
  const global_Reflect_apply = Reflect.apply;
  const global_WeakMap_prototype_has = WeakMap.prototype.has;
  const global_WeakMap_prototype_get = WeakMap.prototype.get;
  const global_WeakMap_prototype_set = WeakMap.prototype.set;
  let counter = 0;
  const registery1 = { __proto__: null };
  const registery2 = new WeakMap();
  APPMAP_GLOBAL_GET_IDENTITY = (value) => {
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
}

let APPMAP_GLOBAL_SERIALIZE;
{
  const global_undefined = undefined;
  const global_String = String;
  const global_JSON_stringify = JSON.stringify;
  const global_Reflect_apply = Reflect.apply;
  const global_Object_prototype_toString = Object.prototype.toString;
  APPMAP_GLOBAL_SERIALIZE = (value) => {
    if (value === APPMAP_GLOBAL_EMPTY_MARKER) {
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
}

let APPMAP_GLOBAL_SERIALIZE_EXCEPTION;
{
  const global_Error = Error;
  APPMAP_GLOBAL_SERIALIZE_EXCEPTION = (value) => {
    if (value === APPMAP_GLOBAL_EMPTY_MARKER) {
      return [];
    }
    if (value instanceof global_Error) {
      return [
        {
          class: APPMAP_GLOBAL_GET_CLASS_NAME(value),
          message: value.message,
          object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
          path: value.stack,
          lineno: null,
        },
      ];
    }
    return [
      {
        class: APPMAP_GLOBAL_GET_CLASS_NAME(value),
        message: null,
        object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
        path: null,
        lineno: null,
      },
    ];
  };
}

let APPMAP_GLOBAL_SERIALIZE_PARAMETER = (value, name) => ({
  name,
  object_id: APPMAP_GLOBAL_GET_IDENTITY(value),
  class: APPMAP_GLOBAL_GET_CLASS_NAME(value),
  value: APPMAP_GLOBAL_SERIALIZE(value),
});
