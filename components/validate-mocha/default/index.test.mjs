import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import { validateMocha } from "./index.mjs?env=test";

const { undefined } = globalThis;

assertThrow(
  () => validateMocha(null),
  /^ExternalAppmapError: Incompatible mocha version \(< 6.0.0\)$/u,
);

assertThrow(
  () => validateMocha({}),
  /^ExternalAppmapError: Incompatible mocha version \(< 6.0.0\)$/u,
);

assertThrow(
  () => validateMocha({ prototype: {} }),
  /^ExternalAppmapError: Incompatible mocha version \(< 6.0.0\)$/u,
);

assertThrow(
  () => validateMocha({ prototype: { version: "7.1.2" } }),
  /^ExternalAppmapError: Incompatible mocha version \(< 8.0.0\)$/u,
);

assertEqual(validateMocha({ prototype: { version: "8.1.2" } }), undefined);
