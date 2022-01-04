import { assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import ValidateAppmap from "./index.mjs";

const { validateAppmap } = ValidateAppmap(
  await buildTestDependenciesAsync(import.meta.url),
);

assertThrow(() => {
  validateAppmap({
    version: "1.6.0",
    metadata: {},
    classMap: [],
    events: [],
  });
}, /^AppmapError: failed to validate appmap/);
