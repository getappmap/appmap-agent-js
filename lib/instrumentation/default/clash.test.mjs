import { strict as Assert } from "assert";
import { parse } from "acorn";
import { buildTestAsync } from "../../../src/build.mjs";
import Clash from "./clash.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["naming"],
  });
  const {
    naming: { getLineage },
  } = dependencies;
  const { checkIdentifierClash } = Clash(dependencies);

  const test = (code, path) =>
    checkIdentifierClash(
      getLineage(
        parse(code, {
          ecmaVersion: 2020,
          sourceType: "module",
        }),
        path,
      ),
      { runtime: "$", path: "/filename.js" },
    );

  assertThrows(
    () => test("$;", "body/0/expression"),
    /^AppmapError: identifier collision/,
  );

  test(`foo;`, "body/0/expression");

  test(`$:;`, "body/0/label");

  test(`$: break $;`, "body/0/body/label");

  test(`$: while (true) continue $;`, "body/0/body/body/label");

  test("const foo = 123; export {foo as $};", "body/1/specifiers/0/exported");

  test("import {$ as foo} from './bar.mjs';", "body/0/specifiers/0/imported");

  test("({$: foo});", "body/0/expression/properties/0/key");

  test("foo.$;", "body/0/expression/property");
};

testAsync();
