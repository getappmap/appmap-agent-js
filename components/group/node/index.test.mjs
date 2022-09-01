import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Group from "./index.mjs";

const { equal: assertEqual } = Assert;

const { getCurrentGroup } = Group(
  await buildTestDependenciesAsync(import.meta.url),
);
assertEqual(typeof getCurrentGroup(), "number");
