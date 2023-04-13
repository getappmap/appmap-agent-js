/* eslint-disable local/global-object-access */

import { hasOwnProperty } from "../../util/index.mjs";

const {
  undefined,
  ReferenceError,
  Reflect: { defineProperty },
} = globalThis;

export const defineGlobal = (name, value, writable = false) => {
  if (!hasOwnProperty(globalThis, name)) {
    return defineProperty(globalThis, name, {
      __proto__: null,
      value,
      writable,
      configurable: false,
      enumerable: false,
    });
  } else {
    return false;
  }
};

export const writeGlobal = (name, value) => {
  if (hasOwnProperty(globalThis, name)) {
    globalThis[name] = value;
    return undefined;
  } else {
    throw ReferenceError("missing global variable");
  }
};

export const readGlobal = (name) => {
  if (hasOwnProperty(globalThis, name)) {
    return globalThis[name];
  } else {
    throw ReferenceError("missing global variable");
  }
};
