import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import ValidateAppmap from "./index.mjs";

const { throws: assertThrows } = Assert;

const { validateAppmap } = ValidateAppmap(
  await buildTestDependenciesAsync(import.meta.url),
);

assertThrows(() => {
  validateAppmap({
    version: "1.6.0",
    metadata: {},
    classMap: [],
    events: [],
  });
}, /^AppmapError: failed to validate appmap/);
