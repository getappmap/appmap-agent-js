import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Validation from "./index.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const { validateConfig } = Validation(
    await buildTestDependenciesAsync(import.meta.url),
  );
  assertThrows(() => {
    validateConfig({ mode: "invalid-mode" });
  }, /^AppmapError: invalid configuration >> mode\/enum/u);
  assertThrows(() => {
    validateConfig({ engine: "invalid-engine-format" });
  }, /^AppmapError: invalid configuration\n/);
};

testAsync();
