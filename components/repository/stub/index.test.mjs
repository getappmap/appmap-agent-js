/* eslint-env node */
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { extractRepositoryDependency } = Repository(
    await buildTestAsync(import.meta),
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
