/* global x */
import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import component from "./index.mjs";

const testAsync = async () => {
  const { runScript } = component(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  Assert.equal(runScript("let x = 123;"), undefined);
  Assert.equal(x, 123);
};

testAsync();
