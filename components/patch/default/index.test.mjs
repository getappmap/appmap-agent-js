import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Patch from "./index.mjs";

const { defineProperty } = Reflect;

const { patch } = Patch(await buildTestDependenciesAsync(import.meta.url));

const prototype = {
  __proto__: null,
  key: 123,
};

const object = {
  __proto__: {
    __proto__: prototype,
  },
};

assertEqual(patch(object, "key", 456), 123);
assertEqual(object.key, 456);
defineProperty(object, "key", {
  __proto__: null,
  configurable: false,
});
assertEqual(patch(object, "key", 789), 456);
assertEqual(object.key, 789);
assertEqual(prototype.key, 123);
assertEqual(patch(object, "KEY", 123), undefined);
