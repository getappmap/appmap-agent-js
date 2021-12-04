/* global x */
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import component from "./index.mjs";

const { runScript } = component(
  await buildTestDependenciesAsync(import.meta.url),
);
Assert.equal(runScript("let x = 123;", "file:///script.js"), undefined);
Assert.equal(x, 123);
