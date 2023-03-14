import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import { defineGlobal, writeGlobal, readGlobal } from "./index.mjs";

const { ReferenceError, undefined } = globalThis;

assertThrow(() => readGlobal("__GLOBAL__"), ReferenceError);

assertThrow(() => writeGlobal("__GLOBAL__", "value"), ReferenceError);

assertEqual(defineGlobal("__GLOBAL__", "value", true), true);

assertEqual(defineGlobal("__GLOBAL__", "value", true), false);

assertEqual(readGlobal("__GLOBAL__"), "value");

assertEqual(writeGlobal("__GLOBAL__", "VALUE"), undefined);

assertEqual(readGlobal("__GLOBAL__"), "VALUE");
