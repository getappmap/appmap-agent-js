import { assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Validation from "./index.mjs";

const { validateConfig } = Validation(
  await buildTestDependenciesAsync(import.meta.url),
);
assertThrow(() => {
  validateConfig({ mode: "invalid-mode" });
}, /^AppmapError: invalid configuration\n/u);
assertThrow(() => {
  validateConfig({ engine: "invalid-engine-format" });
}, /^AppmapError: invalid configuration\n/u);
