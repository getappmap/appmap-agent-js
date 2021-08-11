/* global x */
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import component from "./index.mjs";

const testAsync = async () => {
  const { runScript } = component(
    await buildTestDependenciesAsync(import.meta.url),
  );
  Assert.equal(runScript("let x = 123;"), undefined);
  Assert.equal(x, 123);
};

testAsync();
