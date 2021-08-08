import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const { extractRepositoryHistory } = Repository(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  assertThrows(
    () => extractRepositoryHistory("/foo"),
    /^AssertionError: cannot extract/,
  );
};

testAsync();
