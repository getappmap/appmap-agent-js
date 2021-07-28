import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Repository from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { extractRepositoryPackage } = Repository(
    await buildAsync({
      violation: "error",
      assert: "debug",
      util: "default",
    }),
  );
  assertDeepEqual(extractRepositoryPackage("/foo"), {
    name: null,
    version: null,
  });
};

testAsync();
