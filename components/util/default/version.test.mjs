import { strict as Assert } from "assert";
import { buildTestAsync } from "../../build.mjs";
import Version from "./version.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { matchVersion } = Version(await buildTestAsync(import.meta));
  assertEqual(matchVersion("1.2.3", "1.2.3"), true);
  assertEqual(matchVersion("1.3.2", "1.2.3"), true);
  assertEqual(matchVersion("1.2.3", "1.3.2"), false);
  assertEqual(matchVersion("1.2.3", "1.2"), true);
  assertEqual(matchVersion("1.2", "1.2.3"), false);
};

testAsync();
