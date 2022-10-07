import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { validateExternalConfiguration } from "./index.mjs?env=test";

const { undefined } = globalThis;

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
