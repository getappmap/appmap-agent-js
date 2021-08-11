/* eslint-env node */
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { extractRepositoryDependency } = Repository(
    await buildTestDependenciesAsync(import.meta.url),
  );
  assertDeepEqual(extractRepositoryDependency("/foo", "bar"), {
    directory: "/foo/node_modules/bar",
    package: {
      name: "bar",
      version: "0.0.0",
      homepage: null,
    },
  });
};

testAsync();
