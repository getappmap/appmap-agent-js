import { buildDependenciesAsync } from "../../build.mjs";
import Log from "./index.mjs";

const testAsync = async () => {
  const { logInfo, logError } = Log(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  logInfo("foo");
  logError("bar");
};

testAsync();
