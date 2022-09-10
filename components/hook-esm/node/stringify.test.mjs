import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Stringify from "./stringify.mjs";

const {TextEncoder} = globalThis;

const { stringifyContent } = Stringify(
  await buildTestDependenciesAsync(import.meta.url),
);

assertEqual(stringifyContent("123;"), "123;");

assertEqual(stringifyContent(new TextEncoder("utf8").encode("123;")), "123;");

assertThrow(() => stringifyContent(123));
