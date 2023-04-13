import { assertEqual } from "../../__fixture__.mjs";
import { compileGlob } from "./index.mjs";

const { RegExp } = globalThis;

const { source, flags } = compileGlob("*.js");

const regexp = new RegExp(source, flags);

assertEqual(regexp.test("foo.js"), true);

assertEqual(regexp.test("foo.ts"), false);
