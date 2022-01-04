import { assertEqual } from "../../../../__fixture__.mjs";
import { parse as parseAcorn } from "acorn";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../../build.mjs";
import Naming from "./naming.mjs";

const { createCounter } = await buildTestComponentAsync("util");

const { getName } = Naming(await buildTestDependenciesAsync(import.meta.url));

const test = (content, keys, separator = "@") => {
  let node = parseAcorn(content, { ecmaVersion: 2021, sourceType: "module" });
  let child = node;
  let parent = node;
  for (const key of keys) {
    node = node[key];
    if (
      typeof node === "object" &&
      node !== null &&
      Reflect.getOwnPropertyDescriptor(node, "type") !== undefined
    ) {
      parent = child;
      child = node;
    }
  }
  return getName({ separator, counter: createCounter(0) }, node, parent);
};

assertEqual(
  test("({k:v});", ["body", 0, "expression", "properties", 0, "value"]),
  "k",
);

assertEqual(
  test("({[k]:v});", ["body", 0, "expression", "properties", 0, "value"], "@"),
  "unknown@1",
);

assertEqual(test("(function f () {});", ["body", 0, "expression"]), "f");

assertEqual(test("function f () {}", ["body", 0]), "f");

assertEqual(
  test("export default function () {}", ["body", 0, "declaration"]),
  "default",
);

assertEqual(test("x = 123;", ["body", 0, "expression", "right"]), "x");

assertEqual(
  test("const x = 123;", ["body", 0, "declarations", 0, "init"]),
  "x",
);

assertEqual(test("({});", ["body", 0, "expression"], "@"), "object@1");
