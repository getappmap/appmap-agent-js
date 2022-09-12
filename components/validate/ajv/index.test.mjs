import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Validation from "./index.mjs";

const { undefined } = globalThis;

const { validateExternalConfiguration } = Validation(
  await buildTestDependenciesAsync(import.meta.url),
);

assertEqual(
  validateExternalConfiguration({ extra: "extra-root-property" }),
  undefined,
);

assertThrow(() => {
  validateExternalConfiguration("invalid-configuration-type");
}, /^AppmapError: invalid user-defined configuration\n/u);

assertThrow(() => {
  validateExternalConfiguration({ frameworks: ["invalid@framework@format"] });
}, /^AppmapError: invalid user-defined configuration\n/u);
