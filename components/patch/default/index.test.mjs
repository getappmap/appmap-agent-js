import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Patch from "./index.mjs";

const { patch } = Patch(await buildTestDependenciesAsync(import.meta.url));

const prototype = {
  __proto__: null,
  key: 123,
};
const object = {
  __proto__: prototype,
};

assertEqual(patch(object, "key", 456), 123);
assertEqual(object.key, 456);
assertEqual(prototype.key, 123);
