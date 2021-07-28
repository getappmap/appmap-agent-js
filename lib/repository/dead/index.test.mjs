import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Repository from "./index.mjs";

const { throws: assertThrows } = Assert;

const mainAsync = async () => {
  const { extractRepositoryHistory } = Repository(
    await buildAsync({
      violation: "error",
      assert: "debug",
    }),
  );
  assertThrows(
    () => extractRepositoryHistory("/foo"),
    /^AppmapError: cannot extract/,
  );
};

mainAsync();
