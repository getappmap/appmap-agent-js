import { assertEqual } from "../../__fixture__.mjs";
import { patch } from "./index.mjs";

const {
  Reflect: { defineProperty },
  undefined,
} = globalThis;

const prototype = {
  __proto__: null,
  key: 123,
};

const object = {
  __proto__: {
    __proto__: prototype,
  },
};

assertEqual(
  patch(object, "key", (value) => {
    assertEqual(value, 123);
    return 456;
  }),
  undefined,
);
assertEqual(object.key, 456);
defineProperty(object, "key", {
  __proto__: null,
  configurable: false,
});
assertEqual(
  patch(object, "key", (value) => {
    assertEqual(value, 456);
    return 789;
  }),
  undefined,
);
assertEqual(object.key, 789);
assertEqual(prototype.key, 123);
assertEqual(
  patch(object, "KEY", (value) => {
    assertEqual(value, undefined);
    return 123;
  }),
  undefined,
);
