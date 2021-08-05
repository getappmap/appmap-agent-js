import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import Repository from "./index.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const { extractRepositoryHistory } = Repository(
    await buildTestAsync(import.meta),
  );
  assertThrows(
    () => extractRepositoryHistory("/foo"),
    /^AppmapError: cannot extract/,
  );
};

testAsync();
