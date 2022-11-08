import * as Acorn from "acorn";
import { assertEqual } from "../../../__fixture__.mjs";
import { createCounter } from "../../../util/index.mjs?env=test";
import { getName } from "./naming.mjs?env=test";

const {
  Reflect: { getOwnPropertyDescriptor },
  undefined,
} = globalThis;

const { parse: parseAcorn } = Acorn;

const test = (content, keys, separator = "@") => {
  let node = parseAcorn(content, { ecmaVersion: 2021, sourceType: "module" });
  let child = node;
  let parent = node;
  for (const key of keys) {
    node = node[key];
    if (
      typeof node === "object" &&
      node !== null &&
      getOwnPropertyDescriptor(node, "type") !== undefined
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
