import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Git from "./index.mjs";

const { equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { extractGitInformation } = Git(
    await buildAsync({
      violation: "error",
      assert: "debug",
      util: "default",
    }),
  );
  assertEqual(extractGitInformation(), null);
};

mainAsync();
