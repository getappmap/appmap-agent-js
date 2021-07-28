import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Repository from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { extractRepositoryPackage } = Repository(
    await buildTestAsync(import.meta),
  );
  assertDeepEqual(extractRepositoryPackage("/foo"), {
    name: null,
    version: null,
  });
};

testAsync();
