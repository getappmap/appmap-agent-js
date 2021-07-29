import { strict as Assert } from "assert";
import { parse } from "acorn";
import { buildTestAsync } from "../../../build/index.mjs";
import Naming from "./index.mjs";

Error.stackTraceLimit = Infinity;

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({ ...import.meta, deps: ["util"] });

  const {
    util: { createCounter },
  } = dependencies;

  const { getName, getLineage } = Naming(dependencies);

  const test = (code, path) =>
    getName(
      createCounter(0),
      getLineage(parse(code, { ecmaVersion: 2020 }), path),
    );

  // not nameable //

  assertEqual(test(";", "body/0"), null);

  // environment //

  assertEqual(test(`({});`, "body/0/expression"), "1");

  assertEqual(test("var x = {};", "body/0/declarations/0/init"), "x");

  assertEqual(test("x = {};", "body/0/expression/right"), "x");

  assertEqual(test("(function f () {});", "body/0/expression"), "f");

  assertEqual(test("(class c {});", "body/0/expression"), "c");

  assertEqual(test("function f () {}", "body/0"), "f");

  assertEqual(test("class c {}", "body/0"), "c");

  // property //

  assertEqual(test("({k: {}})", "body/0/expression/properties/0/value"), "1.k");

  assertEqual(
    test("({[k]: {}})", "body/0/expression/properties/0/value"),
    "1.[computed]",
  );

  assertEqual(
    test("({'k': {}})", "body/0/expression/properties/0/value"),
    '1."k"',
  );

  // method //

  assertEqual(test("class c { k () {} }", "body/0/body/body/0/value"), "1.k");

  assertEqual(
    test("class c { static k () {} }", "body/0/body/body/0/value"),
    "1#k",
  );
};

testAsync();
