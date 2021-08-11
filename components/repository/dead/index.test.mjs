import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const { extractRepositoryHistory } = Repository(
    await buildTestDependenciesAsync(import.meta.url),
  );
  assertThrows(
    () => extractRepositoryHistory("/foo"),
    /^AssertionError: cannot extract/,
  );
};

testAsync();
