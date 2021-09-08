import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Frame from "./frame.mjs";

const {
  // deepEqual: assertDeepEqual,
  // equal: assertEqual,
  ok: assert,
} = Assert;

const { isBundleFrame, isJumpFrame, createBundleFrame, createJumpFrame } =
  Frame(await buildTestDependenciesAsync(import.meta.url));

assert(isBundleFrame(createBundleFrame(null)));
assert(isJumpFrame(createJumpFrame(null)));
