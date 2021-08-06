import { buildTestAsync } from "../../../src/build.mjs";
import Log from "./index.mjs";

const testAsync = async () => {
  const { logInfo, logError } = Log(await buildTestAsync(import.meta));
  logInfo("foo");
  logError("bar");
};

testAsync();
