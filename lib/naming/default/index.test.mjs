import { strict as Assert } from "assert";
import { parse } from "acorn";
import { buildTestAsync } from "../../../src/build.mjs";
import Naming from "./index.mjs";

Error.stackTraceLimit = Infinity;

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({ ...import.meta, deps: ["util"] });

  const {
    util: { createCounter },
  } = dependencies;

  const { getQualifiedName, getLineage, parseQualifiedName } =
    Naming(dependencies);

  assertDeepEqual(parseQualifiedName("foo#bar"), {
    qualifier: "foo",
    static: true,
    name: "bar",
  });

  assertDeepEqual(parseQualifiedName("foo"), {
    qualifier: null,
    static: false,
    name: "foo",
  });

  const test = (code, path) =>
    getQualifiedName(
      createCounter(0),
      getLineage(parse(code, { ecmaVersion: 2020 }), path),
    );

  assertEqual(test("123;", "body/0/expression"), null);

  /////////////////
  // environment //
  /////////////////

  assertEqual(test(`({});`, "body/0/expression"), "1");

  assertEqual(test("var x = {};", "body/0/declarations/0/init"), "x");

  assertEqual(test("x = {};", "body/0/expression/right"), "x");

  assertEqual(test("(function f () {});", "body/0/expression"), "f");

  assertEqual(test("(class c {});", "body/0/expression"), "c");

  assertEqual(test("function f () {}", "body/0"), "f");

  assertEqual(test("class c {}", "body/0"), "c");

  //////////////
  // property //
  //////////////

  assertEqual(
    test("({k: {}});", "body/0/expression/properties/0/value"),
    "1.k",
  );

  assertEqual(
    test("({[k]: {}});", "body/0/expression/properties/0/value"),
    "1.[computed]",
  );

  assertEqual(
    test("({'k': {}});", "body/0/expression/properties/0/value"),
    '1."k"',
  );

  ////////////
  // method //
  ////////////

  assertEqual(test("class c { k () {} }", "body/0/body/body/0/value"), "1.k");

  assertEqual(
    test("class c { static k () {} }", "body/0/body/body/0/value"),
    "1#k",
  );
};

testAsync();
