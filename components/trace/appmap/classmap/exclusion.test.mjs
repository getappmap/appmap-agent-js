import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../../build.mjs";
import Exclusion from "./exclusion.mjs";

const { equal: assertEqual } = Assert;

const { createExclusion, isExcluded } = Exclusion(
  await buildTestDependenciesAsync(import.meta.url),
);

const exclusion = createExclusion(["foo#bar", "foo#bar", "(qux)$", "(qux)$"]);

assertEqual(isExcluded(exclusion, "foo#bar"), true);

assertEqual(isExcluded(exclusion, "qux"), true);

assertEqual(isExcluded(exclusion, "foo#qux"), true);

assertEqual(isExcluded(exclusion, "qux#bar"), false);
