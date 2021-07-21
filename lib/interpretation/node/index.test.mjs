/* global x */
import { strict as Assert } from "assert";
import component from "./index.mjs";

const { runScript } = component({}, {});
Assert.equal(runScript("let x = 123;"), undefined);
Assert.equal(x, 123);
