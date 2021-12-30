/* eslint-env node */
import { assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { extractRepositoryDependency } = Repository(
  await buildTestDependenciesAsync(import.meta.url),
);
assertDeepEqual(extractRepositoryDependency("file:///home", "bar"), {
  directory: "file:///home/node_modules/bar",
  package: {
    name: "bar",
    version: "0.0.0",
    homepage: null,
  },
});
