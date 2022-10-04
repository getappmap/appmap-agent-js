import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { stringifyContent } from "./stringify.mjs?env=test";

const { TextEncoder } = globalThis;

assertEqual(stringifyContent("123;"), "123;");

assertEqual(stringifyContent(new TextEncoder("utf8").encode("123;")), "123;");

assertThrow(() => stringifyContent(123));
