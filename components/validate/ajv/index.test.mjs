import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { validateExternalConfiguration } from "./index.mjs?env=test";

const { undefined } = globalThis;

assertEqual(
  validateExternalConfiguration({ extra: "extra-root-property" }),
  undefined,
);

assertThrow(() => {
  validateExternalConfiguration("invalid-configuration-type");
}, /^ExternalAppmapError: Failed to validate data against JSON schema$/u);

assertThrow(() => {
  validateExternalConfiguration({ frameworks: ["invalid@framework@format"] });
}, /^ExternalAppmapError: Failed to validate data against JSON schema$/u);
