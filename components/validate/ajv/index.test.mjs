import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Validation from "./index.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const { validateConfiguration } = Validation(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  assertThrows(() => {
    validateConfiguration({ protocol: "invalid-protocol" });
  }, /^AppmapError: invalid configuration >> protocol\/enum/);
  assertThrows(() => {
    validateConfiguration({ engine: "invalid-engine-format" });
  }, /^AppmapError: invalid configuration\n/);
};

testAsync();
