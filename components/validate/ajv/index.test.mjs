import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Validation from "./index.mjs";

const { validateConfig } = Validation(
  await buildTestDependenciesAsync(import.meta.url),
);

assertEqual(validateConfig({ extra: "extra-root-property" }), undefined);

assertThrow(() => {
  validateConfig("invalid-configuration-type");
}, /^AppmapError: invalid configuration\n/u);

assertThrow(() => {
  validateConfig({ frameworks: ["invalid@framework@format"] });
}, /^AppmapError: invalid configuration\n/u);
